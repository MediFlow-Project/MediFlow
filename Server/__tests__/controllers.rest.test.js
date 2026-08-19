jest.mock("../models", () => require("./utils").createModelsMock());
jest.mock("../sockets/emit", () => ({
  emitChatMessage: jest.fn(),
  emitChatRead: jest.fn(),
  emitQueueCompleted: jest.fn().mockResolvedValue({}),
  emitQueueUpdated: jest.fn().mockResolvedValue({}),
}));
jest.mock("../helpers/midtrans", () => ({
  createSnapToken: jest.fn(),
  canReuseSnap: jest.fn(),
  verifySignature: jest.fn(),
  amountsMatch: jest.fn(),
  mapNotificationStatus: jest.fn(),
}));
jest.mock("../helpers/chatbotLlm", () => ({ recommendWithFallback: jest.fn() }));
jest.mock("../helpers/doctorAvailability", () => ({
  getAvailableDoctors: jest.fn(),
  toPublicRecommendation: jest.fn(),
}));
jest.mock("../helpers/dashboardCounts", () => ({
  getDashboardCounts: jest.fn().mockResolvedValue({ bookingsToday: 2, activeQueues: 1 }),
}));

const {
  Appointment,
  Doctor,
  Message,
  ChatRead,
  Consultation,
  PrescriptionItem,
  Medicine,
  Invoice,
  User,
  Specialty,
  Schedule,
} = require("../models");
const chatController = require("../controllers/chatController");
const consultationController = require("../controllers/consultationController");
const invoiceController = require("../controllers/invoiceController");
const paymentController = require("../controllers/paymentController");
const chatbotController = require("../controllers/chatbotController");
const dashboardController = require("../controllers/dashboardController");
const medicineController = require("../controllers/medicineController");
const {
  AdminSpecialtyController,
  AdminDoctorController,
  AdminScheduleController,
  AdminAppointmentController,
} = require("../controllers/adminController");
const { mockRes, mockNext } = require("./utils");
const { todayDateOnly } = require("../helpers/date");
const { createSnapToken, canReuseSnap, verifySignature, amountsMatch, mapNotificationStatus } = require("../helpers/midtrans");
const { recommendWithFallback } = require("../helpers/chatbotLlm");
const { getAvailableDoctors, toPublicRecommendation } = require("../helpers/doctorAvailability");

function req(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 10, role: "patient" },
    doctor: { id: 2, userId: 20, consultationFee: 100000 },
    ...overrides,
  };
}

describe("chatController", () => {
  const appointment = {
    id: 3,
    patientId: 10,
    doctorId: 2,
    status: "booked",
    date: "2026-08-20",
    session: "morning",
    Patient: { id: 10, name: "Budi" },
    Doctor: { userId: 20, User: { name: "dr. A" } },
  };

  it("inbox for patient doctor admin", async () => {
    const next = mockNext();
    await chatController.inbox(req({ user: { id: 1, role: "admin" } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(403);
    Appointment.findAll.mockResolvedValue([appointment]);
    Message.findOne.mockResolvedValue({ id: 1, senderId: 20, body: "hai", createdAt: "t" });
    ChatRead.findOne.mockResolvedValue({ lastReadAt: "2020-01-01" });
    Message.count.mockResolvedValue(2);
    const res = mockRes();
    await chatController.inbox(req(), res, mockNext());
    expect(res.json.mock.calls[0][0][0].unreadCount).toBe(2);
    Doctor.findOne.mockResolvedValue({ id: 2 });
    await chatController.inbox(req({ user: { id: 20, role: "doctor" } }), mockRes(), mockNext());
    Doctor.findOne.mockResolvedValue(null);
    const next2 = mockNext();
    await chatController.inbox(req({ user: { id: 20, role: "doctor" } }), mockRes(), next2);
    expect(next2.mock.calls[0][0].status).toBe(403);
    const next3 = mockNext();
    await chatController.inbox(req({ user: { id: 1, role: "nurse" } }), mockRes(), next3);
    expect(next3.mock.calls[0][0].status).toBe(403);
  });

  it("messages participant and create", async () => {
    Appointment.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await chatController.listMessages(req({ params: { id: 1 } }), mockRes(), next);
    Appointment.findByPk.mockResolvedValue(appointment);
    Message.findAll.mockResolvedValue([{ id: 1, appointmentId: 3, senderId: 10, body: "hi", createdAt: "t" }]);
    const res = mockRes();
    await chatController.listMessages(req({ params: { id: 3 } }), res, mockNext());
    expect(res.json.mock.calls[0][0][0].senderRole).toBe("patient");

    const next403 = mockNext();
    await chatController.createMessage(req({ params: { id: 3 }, user: { id: 99, role: "patient" }, body: { body: "x" } }), mockRes(), next403);
    expect(next403.mock.calls[0][0].status).toBe(403);

    Appointment.findByPk.mockResolvedValue({ ...appointment, status: "in_consultation" });
    const next409 = mockNext();
    await chatController.createMessage(req({ params: { id: 3 }, body: { body: "hi" } }), mockRes(), next409);
    expect(next409.mock.calls[0][0].status).toBe(409);
    expect(next409.mock.calls[0][0].message).toMatch(/setelah konsultasi/i);

    Appointment.findByPk.mockResolvedValue({ ...appointment, status: "completed", date: "2000-01-01" });
    const nextClosed = mockNext();
    await chatController.createMessage(req({ params: { id: 3 }, body: { body: "hi" } }), mockRes(), nextClosed);
    expect(nextClosed.mock.calls[0][0].status).toBe(409);
    expect(nextClosed.mock.calls[0][0].message).toMatch(/H\+1/i);

    Appointment.findByPk.mockResolvedValue({ ...appointment, status: "completed", date: todayDateOnly() });
    const next400 = mockNext();
    await chatController.createMessage(req({ params: { id: 3 }, body: { body: "   " } }), mockRes(), next400);
    await chatController.createMessage(req({ params: { id: 3 }, body: { body: "x".repeat(1001) } }), mockRes(), mockNext());
    Message.create.mockResolvedValue({ id: 11, appointmentId: 3, senderId: 10, body: "halo", createdAt: "t" });
    const res2 = mockRes();
    await chatController.createMessage(req({ params: { id: 3 }, body: { body: "halo" } }), res2, mockNext());
    expect(res2.status).toHaveBeenCalledWith(201);
  });

  it("markRead create and update", async () => {
    Appointment.findByPk.mockResolvedValue(appointment);
    ChatRead.findOrCreate.mockResolvedValue([{ lastReadAt: new Date() }, true]);
    const res = mockRes();
    await chatController.markRead(req({ params: { id: 3 } }), res, mockNext());
    expect(res.json).toHaveBeenCalled();
    const row = { lastReadAt: new Date(), update: jest.fn() };
    ChatRead.findOrCreate.mockResolvedValue([row, false]);
    await chatController.markRead(req({ params: { id: 3 } }), mockRes(), mockNext());
    expect(row.update).toHaveBeenCalled();
  });
});

describe("consultation complete", () => {
  it("validates and completes", async () => {
    const next = mockNext();
    await consultationController.complete(req({ body: {} }), mockRes(), next);
    await consultationController.complete(req({ body: { appointmentId: 1, items: "no" } }), mockRes(), mockNext());
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: [{ medicineId: 0, quantity: 1, dosage: "x" }] } }), mockRes(), mockNext());
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: [{ medicineId: 1, quantity: 0, dosage: "x" }] } }), mockRes(), mockNext());
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: [{ medicineId: 1, quantity: 1, dosage: "" }] } }), mockRes(), mockNext());

    Appointment.findByPk.mockResolvedValue(null);
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d" } }), mockRes(), mockNext());
    Appointment.findByPk.mockResolvedValue({ id: 1, doctorId: 9, status: "in_consultation" });
    const next403 = mockNext();
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d" } }), mockRes(), next403);
    expect(next403.mock.calls[0][0].status).toBe(403);
    Appointment.findByPk.mockResolvedValue({ id: 1, doctorId: 2, status: "called", update: jest.fn() });
    const next409 = mockNext();
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d" } }), mockRes(), next409);
    expect(next409.mock.calls[0][0].status).toBe(409);
    Appointment.findByPk.mockResolvedValue({ id: 1, doctorId: 2, status: "in_consultation", date: "2026-08-20", session: "morning", queueNumber: 1, update: jest.fn() });
    Consultation.findOne.mockResolvedValue({ id: 1 });
    const nextExist = mockNext();
    await consultationController.complete(req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d" } }), mockRes(), nextExist);
    expect(nextExist.mock.calls[0][0].status).toBe(409);

    Consultation.findOne.mockResolvedValue(null);
    Medicine.findAll.mockResolvedValue([{ id: 3, price: 5000 }]);
    Consultation.create.mockResolvedValue({ id: 8, complaint: "c", diagnosis: "d", notes: null });
    PrescriptionItem.create.mockResolvedValue({ id: 1, medicineId: 3, quantity: 2, dosage: "3x1" });
    Invoice.create.mockResolvedValue({ id: 9, amount: 110000, status: "unpaid" });
    const res = mockRes();
    await consultationController.complete(
      req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", notes: "n", items: [{ medicineId: 3, quantity: 2, dosage: "3x1" }] } }),
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(201);

    Medicine.findAll.mockResolvedValue([]);
    const nextMed = mockNext();
    await consultationController.complete(
      req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: [{ medicineId: 99, quantity: 1, dosage: "3x1" }] } }),
      mockRes(),
      nextMed
    );
    expect(nextMed.mock.calls[0][0].status).toBe(400);
  });
});

describe("invoice and payment", () => {
  it("detail pay adminList notification", async () => {
    Invoice.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await invoiceController.detail(req({ params: { id: 1 } }), mockRes(), next);
    const invoice = {
      id: 4,
      appointmentId: 3,
      amount: 100000,
      status: "unpaid",
      midtransOrderId: null,
      snapToken: null,
      update: jest.fn(),
      Appointment: {
        patientId: 10,
        doctorId: 2,
        date: "2026-08-20",
        session: "morning",
        Patient: { id: 10, name: "Budi" },
        Doctor: { id: 2, userId: 20, consultationFee: 100000, User: { name: "dr. A" }, Specialty: { name: "Gigi" } },
        Consultation: { complaint: "c", diagnosis: "d", notes: null, PrescriptionItems: [] },
      },
    };
    Invoice.findByPk.mockResolvedValue(invoice);
    const res = mockRes();
    await invoiceController.detail(req({ params: { id: 4 } }), res, mockNext());
    expect(res.json).toHaveBeenCalled();
    await invoiceController.detail(req({ params: { id: 4 }, user: { id: 1, role: "admin" } }), mockRes(), mockNext());
    await invoiceController.detail(req({ params: { id: 4 }, user: { id: 20, role: "doctor" } }), mockRes(), mockNext());
    const next403 = mockNext();
    await invoiceController.detail(req({ params: { id: 4 }, user: { id: 99, role: "patient" } }), mockRes(), next403);
    expect(next403.mock.calls[0][0].status).toBe(403);

    invoice.status = "paid";
    const nextPaid = mockNext();
    await invoiceController.pay(req({ params: { id: 4 } }), mockRes(), nextPaid);
    expect(nextPaid.mock.calls[0][0].status).toBe(409);
    invoice.status = "pending";
    canReuseSnap.mockReturnValue(true);
    invoice.snapToken = "old";
    const resPay = mockRes();
    await invoiceController.pay(req({ params: { id: 4 } }), resPay, mockNext());
    expect(resPay.json.mock.calls[0][0].snapToken).toBe("old");
    canReuseSnap.mockReturnValue(false);
    invoice.status = "unpaid";
    createSnapToken.mockResolvedValue({ orderId: "OID", snapToken: "new", clientKey: "ck" });
    await invoiceController.pay(req({ params: { id: 4 } }), mockRes(), mockNext());
    const nextPay403 = mockNext();
    await invoiceController.pay(req({ params: { id: 4 }, user: { id: 99, role: "patient" } }), mockRes(), nextPay403);

    const nextStatus = mockNext();
    await invoiceController.adminList(req({ query: { status: "nope" } }), mockRes(), nextStatus);
    await invoiceController.adminList(req({ query: { date: "bad" } }), mockRes(), mockNext());
    Invoice.findAll.mockResolvedValue([invoice]);
    const resAdmin = mockRes();
    await invoiceController.adminList(req({ query: { status: "unpaid", date: "2026-08-20" } }), resAdmin, mockNext());
    expect(resAdmin.json).toHaveBeenCalled();

    verifySignature.mockReturnValue(false);
    const nextSig = mockNext();
    await paymentController.notification(req({ body: {} }), mockRes(), nextSig);
    expect(nextSig.mock.calls[0][0].status).toBe(403);
    verifySignature.mockReturnValue(true);
    Invoice.findOne.mockResolvedValue(null);
    const resN = mockRes();
    await paymentController.notification(req({ body: { order_id: "x" } }), resN, mockNext());
    expect(resN.json.mock.calls[0][0].received).toBe(true);
    Invoice.findOne.mockResolvedValue({ ...invoice, status: "unpaid", update: jest.fn() });
    amountsMatch.mockReturnValue(false);
    await paymentController.notification(req({ body: { order_id: "x", gross_amount: "1" } }), mockRes(), mockNext());
    amountsMatch.mockReturnValue(true);
    mapNotificationStatus.mockReturnValue("paid");
    await paymentController.notification(req({ body: { order_id: "x", gross_amount: "100000" } }), mockRes(), mockNext());
    mapNotificationStatus.mockReturnValue(null);
    await paymentController.notification(req({ body: { order_id: "x" } }), mockRes(), mockNext());
    Invoice.findOne.mockResolvedValue({ status: "paid" });
    await paymentController.notification(req({ body: { order_id: "x" } }), mockRes(), mockNext());
  });
});

describe("chatbot dashboard medicines admin", () => {
  it("chatbot recommend", async () => {
    const next = mockNext();
    await chatbotController.recommend(req({ body: {} }), mockRes(), next);
    await chatbotController.recommend(req({ body: { message: "x".repeat(1001) } }), mockRes(), mockNext());
    getAvailableDoctors.mockResolvedValue([]);
    const res = mockRes();
    await chatbotController.recommend(req({ body: { message: "sakit gigi" } }), res, mockNext());
    expect(res.json.mock.calls[0][0].recommendations).toEqual([]);
    getAvailableDoctors.mockResolvedValue([{ doctorId: 1 }]);
    recommendWithFallback.mockResolvedValue({ reply: "ok", recommendations: [{ doctorId: 1 }] });
    toPublicRecommendation.mockReturnValue({ doctorId: 1, doctorName: "dr. A" });
    const res2 = mockRes();
    await chatbotController.recommend(req({ body: { message: "sakit gigi" } }), res2, mockNext());
    expect(res2.json.mock.calls[0][0].recommendations).toHaveLength(1);
    toPublicRecommendation.mockReturnValue(null);
    recommendWithFallback.mockResolvedValue({ reply: "ok", recommendations: [] });
    await chatbotController.recommend(req({ body: { message: "sakit" } }), mockRes(), mockNext());
  });

  it("dashboard and medicines", async () => {
    const res = mockRes();
    await dashboardController.show(req(), res, mockNext());
    expect(res.json.mock.calls[0][0].bookingsToday).toBe(2);
    Medicine.findAll.mockResolvedValue([{ id: 1, name: "Paracetamol", price: 3000 }]);
    await medicineController.list(req(), mockRes(), mockNext());
    Medicine.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await medicineController.detail(req({ params: { id: 1 } }), mockRes(), next);
    Medicine.findByPk.mockResolvedValue({ id: 1, name: "P", price: 1 });
    await medicineController.detail(req({ params: { id: 1 } }), mockRes(), mockNext());
    const next400 = mockNext();
    await medicineController.create(req({ body: {} }), mockRes(), next400);
    await medicineController.create(req({ body: { name: "Obat", price: -1 } }), mockRes(), mockNext());
    Medicine.create.mockResolvedValue({ id: 2, name: "Obat", price: 1000 });
    const resC = mockRes();
    await medicineController.create(req({ body: { name: "Obat", price: 1000 } }), resC, mockNext());
    expect(resC.status).toHaveBeenCalledWith(201);
    Medicine.findByPk.mockResolvedValue(null);
    await medicineController.update(req({ params: { id: 9 }, body: { name: "A", price: 1 } }), mockRes(), mockNext());
    const row = { update: jest.fn(), destroy: jest.fn() };
    Medicine.findByPk.mockResolvedValue(row);
    await medicineController.update(req({ params: { id: 1 }, body: { name: "A", price: 2 } }), mockRes(), mockNext());
    await medicineController.update(
      req({ params: { id: 1 }, body: { name: "A", price: 2, imgUrl: "http://x.test/obat.png" } }),
      mockRes(),
      mockNext()
    );
    Medicine.findByPk.mockResolvedValue(null);
    await medicineController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());
    Medicine.findByPk.mockResolvedValue(row);
    await medicineController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());
  });

  it("admin crud", async () => {
    Specialty.findAll.mockResolvedValue([]);
    await AdminSpecialtyController.list(req(), mockRes(), mockNext());
    const next = mockNext();
    await AdminSpecialtyController.create(req({ body: {} }), mockRes(), next);
    Specialty.create.mockResolvedValue({ id: 1, name: "Gigi" });
    await AdminSpecialtyController.create(req({ body: { name: "Gigi", description: "d" } }), mockRes(), mockNext());
    await AdminSpecialtyController.create(
      req({ body: { name: "Anak", description: "a", imgUrl: "http://x.test/anak.png" } }),
      mockRes(),
      mockNext()
    );
    Specialty.findByPk.mockResolvedValue(null);
    await AdminSpecialtyController.update(req({ params: { id: 1 }, body: { name: "X" } }), mockRes(), mockNext());
    const spec = { name: "Gigi", description: "d", id: 1, update: jest.fn(), destroy: jest.fn() };
    Specialty.findByPk.mockResolvedValue(spec);
    await AdminSpecialtyController.update(req({ params: { id: 1 }, body: { name: "X", description: "n" } }), mockRes(), mockNext());
    await AdminSpecialtyController.update(
      req({ params: { id: 1 }, body: { imgUrl: "http://x.test/gigi.png" } }),
      mockRes(),
      mockNext()
    );
    await AdminSpecialtyController.update(req({ params: { id: 1 }, body: { imgUrl: "" } }), mockRes(), mockNext());
    Doctor.count.mockResolvedValue(1);
    const next409 = mockNext();
    await AdminSpecialtyController.destroy(req({ params: { id: 1 } }), mockRes(), next409);
    Doctor.count.mockResolvedValue(0);
    await AdminSpecialtyController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());
    Specialty.findByPk.mockResolvedValue(null);
    await AdminSpecialtyController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());

    Doctor.findAll.mockResolvedValue([{ id: 1, userId: 2, specialtyId: 1, consultationFee: 1, bio: "", imgUrl: null, User: { name: "dr. A", email: "a@test.com", phone: "1" }, Specialty: { id: 1, name: "Umum" } }]);
    await AdminDoctorController.list(req(), mockRes(), mockNext());
    await AdminDoctorController.create(req({ body: {} }), mockRes(), mockNext());
    Specialty.findByPk.mockResolvedValue(null);
    await AdminDoctorController.create(req({ body: { name: "A", email: "a@test.com", password: "123456", specialtyId: 1, consultationFee: 1 } }), mockRes(), mockNext());
    Specialty.findByPk.mockResolvedValue({ id: 1 });
    User.create.mockResolvedValue({ id: 8 });
    Doctor.create.mockResolvedValue({ id: 3 });
    Doctor.findByPk.mockResolvedValue({ id: 3, userId: 8, specialtyId: 1, consultationFee: 1, bio: "", imgUrl: null, User: { name: "A", email: "a@test.com", phone: null }, Specialty: { id: 1, name: "Umum" } });
    const resDoc = mockRes();
    await AdminDoctorController.create(req({ body: { name: "A", email: "a@test.com", password: "123456", specialtyId: 1, consultationFee: 1, phone: "081", bio: "b", imgUrl: "http://x.test/a.png" } }), resDoc, mockNext());
    expect(resDoc.status).toHaveBeenCalledWith(201);
    Doctor.findByPk.mockResolvedValue(null);
    await AdminDoctorController.update(req({ params: { id: 1 }, body: {} }), mockRes(), mockNext());
    const doctor = { id: 1, userId: 8, specialtyId: 1, consultationFee: 1, bio: "", imgUrl: null, User: { name: "A", email: "a@test.com", phone: "1", update: jest.fn() }, update: jest.fn() };
    Doctor.findByPk.mockResolvedValue(doctor);
    await AdminDoctorController.update(req({ params: { id: 1 }, body: { name: "B", phone: "2", email: "b@test.com", specialtyId: 1, consultationFee: 2, bio: "n", imgUrl: null } }), mockRes(), mockNext());
    Doctor.findByPk.mockResolvedValue(null);
    await AdminDoctorController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());
    Doctor.findByPk.mockResolvedValue({ id: 1, userId: 8 });
    Appointment.count.mockResolvedValue(2);
    const nextDoc = mockNext();
    await AdminDoctorController.destroy(req({ params: { id: 1 } }), mockRes(), nextDoc);
    Appointment.count.mockResolvedValue(0);
    Doctor.findByPk.mockResolvedValue({ id: 1, userId: 8, destroy: jest.fn() });
    Schedule.destroy.mockResolvedValue(1);
    User.destroy.mockResolvedValue(1);
    await AdminDoctorController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());

    Schedule.findAll.mockResolvedValue([]);
    await AdminScheduleController.list(req({ query: { doctorId: 1 } }), mockRes(), mockNext());
    await AdminScheduleController.create(req({ body: {} }), mockRes(), mockNext());
    await AdminScheduleController.create(req({ body: { doctorId: 1, dayOfWeek: 1, session: "eve", startTime: "08:00", endTime: "12:00", quota: 10 } }), mockRes(), mockNext());
    Doctor.findByPk.mockResolvedValue(null);
    await AdminScheduleController.create(req({ body: { doctorId: 1, dayOfWeek: 1, session: "morning", startTime: "08:00", endTime: "12:00", quota: 10 } }), mockRes(), mockNext());
    Doctor.findByPk.mockResolvedValue({ id: 1 });
    Schedule.create.mockResolvedValue({ id: 1 });
    await AdminScheduleController.create(req({ body: { doctorId: 1, dayOfWeek: 1, session: "morning", startTime: "08:00", endTime: "12:00", quota: 10 } }), mockRes(), mockNext());
    Schedule.findByPk.mockResolvedValue(null);
    await AdminScheduleController.update(req({ params: { id: 1 }, body: {} }), mockRes(), mockNext());
    const sch = { dayOfWeek: 1, session: "morning", startTime: "08:00", endTime: "12:00", quota: 10, update: jest.fn(), destroy: jest.fn() };
    Schedule.findByPk.mockResolvedValue(sch);
    await AdminScheduleController.update(req({ params: { id: 1 }, body: { session: "eve" } }), mockRes(), mockNext());
    await AdminScheduleController.update(req({ params: { id: 1 }, body: { dayOfWeek: 2, session: "afternoon", startTime: "13:00", endTime: "17:00", quota: 8 } }), mockRes(), mockNext());
    Schedule.findByPk.mockResolvedValue(null);
    await AdminScheduleController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());
    Schedule.findByPk.mockResolvedValue(sch);
    await AdminScheduleController.destroy(req({ params: { id: 1 } }), mockRes(), mockNext());

    const nextDate = mockNext();
    await AdminAppointmentController.list(req({ query: { date: "bad" } }), mockRes(), nextDate);
    Appointment.findAll.mockResolvedValue([
      { id: 1, patientId: 10, doctorId: 2, date: "2026-08-20", session: "morning", queueNumber: 1, status: "booked", Patient: { id: 10, name: "Budi" }, Doctor: { id: 2, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" } } },
    ]);
    const resAp = mockRes();
    await AdminAppointmentController.list(req({ query: { status: "booked", date: "2026-08-20", doctorId: 2 } }), resAp, mockNext());
    expect(resAp.json).toHaveBeenCalled();
  });
});
