jest.mock("../models", () => require("./utils").createModelsMock());
jest.mock("../sockets/emit", () => ({
  emitChatMessage: jest.fn(),
  emitChatRead: jest.fn(),
  emitQueueUpdated: jest.fn().mockResolvedValue({}),
  emitQueueCompleted: jest.fn().mockResolvedValue({}),
}));
jest.mock("../helpers/dashboardCounts", () => ({
  getDashboardCounts: jest.fn().mockRejectedValue(new Error("db")),
}));

const {
  Appointment,
  Doctor,
  Medicine,
  Invoice,
  Specialty,
  Schedule,
  User,
} = require("../models");
const consultationController = require("../controllers/consultationController");
const chatController = require("../controllers/chatController");
const dashboardController = require("../controllers/dashboardController");
const medicineController = require("../controllers/medicineController");
const invoiceController = require("../controllers/invoiceController");
const {
  AdminSpecialtyController,
  AdminDoctorController,
  AdminScheduleController,
  AdminAppointmentController,
} = require("../controllers/adminController");
const AppointmentController = require("../controllers/appointmentController");
const DoctorController = require("../controllers/doctorController");
const SpecialtyController = require("../controllers/specialtyController");
const QueueController = require("../controllers/queueController");
const AuthController = require("../controllers/authController");
const { mockRes, mockNext } = require("./utils");
const { formatDate, isValidDateOnly } = require("../helpers/date");
const { serializePrescriptionItems } = require("../helpers/visitDetails");
const { toPublicRecommendation } = require("../helpers/doctorAvailability");
const errorHandler = require("../middlewares/errorHandler");

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

describe("remaining branches", () => {
  it("covers helper edge branches", () => {
    expect(formatDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isValidDateOnly("")).toBe(false);
    expect(serializePrescriptionItems({ PrescriptionItems: [{ quantity: "2", Medicine: {} }] })[0].price).toBe(0);
    expect(serializePrescriptionItems({ PrescriptionItems: [{ quantity: 1 }] })[0].name).toBeNull();
    expect(
      toPublicRecommendation(
        { doctorId: 1, reason: "ok", nextSession: { date: "2026-08-20", session: "morning" } },
        [{ doctorId: 1, doctorName: "A", specialtyName: "Gigi", sessions: [{ date: "2026-08-20", session: "morning" }] }]
      ).reason
    ).toBe("ok");
    expect(
      toPublicRecommendation({ doctorId: 1, nextSession: { date: "2026-08-20", session: "morning" } }, [
        { doctorId: 1, sessions: [{ date: "x", session: "morning" }] },
      ])
    ).toBeNull();
    errorHandler({ name: "SequelizeValidationError", errors: [] }, {}, mockRes(), jest.fn());
  });

  it("covers controller catch and extra roles", async () => {
    const next = mockNext();
    await dashboardController.show(req(), mockRes(), next);
    expect(next.mock.calls[0][0].message).toBe("db");

    Specialty.findAll.mockRejectedValue(new Error("fail"));
    await SpecialtyController.list(req(), mockRes(), mockNext());
    await AdminSpecialtyController.list(req(), mockRes(), mockNext());
    Doctor.findAll.mockRejectedValue(new Error("fail"));
    await DoctorController.list(req(), mockRes(), mockNext());
    await AdminDoctorController.list(req(), mockRes(), mockNext());
    Schedule.findAll.mockRejectedValue(new Error("fail"));
    await AdminScheduleController.list(req(), mockRes(), mockNext());
    Medicine.findAll.mockRejectedValue(new Error("fail"));
    await medicineController.list(req(), mockRes(), mockNext());

    const appointment = {
      id: 3,
      patientId: 10,
      doctorId: 2,
      status: "booked",
      Doctor: { userId: 99 },
    };
    Appointment.findByPk.mockResolvedValue(appointment);
    Doctor.findOne.mockResolvedValue({ id: 2 });
    const res = mockRes();
    await chatController.listMessages(req({ params: { id: 3 }, user: { id: 20, role: "doctor" } }), res, mockNext());

    Invoice.findByPk.mockResolvedValue({
      id: 1,
      appointmentId: 3,
      amount: 1,
      status: "unpaid",
      Appointment: { patientId: 1, doctorId: 2, Doctor: null },
    });
    Doctor.findByPk.mockResolvedValue({ userId: 20 });
    await invoiceController.detail(req({ params: { id: 1 }, user: { id: 20, role: "doctor" } }), mockRes(), mockNext());
    Invoice.findByPk.mockResolvedValue({ id: 1, Appointment: null });
    await invoiceController.detail(req({ params: { id: 1 }, user: { id: 1, role: "admin" } }), mockRes(), mockNext());

    Invoice.findAll.mockResolvedValue([
      { id: 1, appointmentId: 1, amount: 1, status: "unpaid", midtransOrderId: null, Appointment: null },
    ]);
    await invoiceController.adminList(req({ query: {} }), mockRes(), mockNext());

    await consultationController.complete(
      req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: [{ medicineId: 1, quantity: "2", dosage: "3x1" }] } }),
      mockRes(),
      mockNext()
    );

    Doctor.findOne.mockResolvedValue(null);
    await AppointmentController.list(req({ user: { id: 20, role: "doctor" } }), mockRes(), mockNext());

    Appointment.findByPk.mockResolvedValue({
      id: 1,
      patientId: 10,
      doctorId: 2,
      date: "2026-08-20",
      session: "morning",
      queueNumber: 1,
      status: "waiting",
      update: jest.fn(),
      Doctor: { userId: 20, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" } },
      Patient: { id: 10, name: "Budi" },
    });
    Appointment.findByPk
      .mockResolvedValueOnce({
        id: 1,
        patientId: 10,
        doctorId: 2,
        date: "2026-08-20",
        session: "morning",
        queueNumber: 1,
        status: "waiting",
        update: jest.fn(),
        Doctor: { userId: 20, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" } },
        Patient: { id: 10, name: "Budi" },
      })
      .mockResolvedValueOnce({
        id: 1,
        patientId: 10,
        doctorId: 2,
        date: "2026-08-20",
        session: "morning",
        queueNumber: 1,
        status: "cancelled",
        Doctor: { userId: 20, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" } },
        Patient: { id: 10, name: "Budi" },
      });
    await AppointmentController.cancel(req({ params: { id: 1 }, user: { id: 10, role: "admin" } }), mockRes(), mockNext());

    await QueueController.openSession(req({ body: { date: "2026-13-40", session: "morning" } }), mockRes(), mockNext());

    Appointment.findByPk.mockResolvedValue({
      id: 1,
      patientId: 10,
      doctorId: 2,
      date: "2026-08-20",
      session: "morning",
      queueNumber: 1,
      status: "booked",
      Doctor: { userId: 20, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" } },
      Patient: { id: 10, name: "Budi" },
    });
    await AppointmentController.detail(req({ params: { id: 1 }, user: { id: 20, role: "doctor" } }), mockRes(), mockNext());
    const next403 = mockNext();
    await AppointmentController.detail(req({ params: { id: 1 }, user: { id: 77, role: "patient" } }), mockRes(), next403);

    User.findByPk.mockResolvedValue({
      toSafeJSON: () => ({ id: 2, role: "doctor" }),
      Doctor: null,
    });
    const AuthController = require("../controllers/authController");
    await AuthController.me(req({ user: { id: 2 } }), mockRes(), mockNext());

    Specialty.findAll.mockResolvedValue([{ id: 1, name: "Gigi", description: "d" }]);
    await SpecialtyController.list(req(), mockRes(), mockNext());
    Specialty.findByPk.mockResolvedValue({
      id: 1,
      name: "Gigi",
      description: "d",
      Doctors: [
        {
          id: 2,
          consultationFee: 1,
          User: { name: "dr. A" },
          Schedules: [
            { dayOfWeek: new Date().getDay(), session: "afternoon", startTime: "13:00", endTime: "16:00", quota: 5 },
          ],
        },
      ],
    });
    Appointment.findAll.mockResolvedValue([]);
    await SpecialtyController.detail(req({ params: { id: 1 } }), mockRes(), mockNext());

    await medicineController.create(req({ body: { name: "Obat", price: "1500" } }), mockRes(), mockNext());
    await medicineController.create(req({ body: { name: "Obat", price: 1500 } }), mockRes(), mockNext());
    await medicineController.create(
      req({ body: { name: "Obat", price: 1500, imgUrl: "http://x.test/obat.png" } }),
      mockRes(),
      mockNext()
    );
    await medicineController.create(req({ body: { name: "Obat", price: 1500, imgUrl: "" } }), mockRes(), mockNext());
    await medicineController.create(req({ body: { name: "Obat", price: "" } }), mockRes(), mockNext());
    await medicineController.create(req({ body: { name: "Obat" } }), mockRes(), mockNext());

    await consultationController.complete(
      req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: { medicineId: 1 } } }),
      mockRes(),
      mockNext()
    );
    await consultationController.complete(
      req({ body: { appointmentId: 1, complaint: "c", diagnosis: "d", items: [{ medicineId: 1, quantity: null, dosage: "x" }] } }),
      mockRes(),
      mockNext()
    );

    const spec = { name: "Gigi", description: "d", update: jest.fn() };
    Specialty.findByPk.mockResolvedValue(spec);
    await AdminSpecialtyController.update(req({ params: { id: 1 }, body: {} }), mockRes(), mockNext());
    await AdminSpecialtyController.update(
      req({ params: { id: 1 }, body: { imgUrl: "http://x.test/gigi.png" } }),
      mockRes(),
      mockNext()
    );

    Specialty.findByPk.mockResolvedValue({ id: 1 });
    User.create.mockResolvedValue({ id: 8 });
    Doctor.create.mockResolvedValue({ id: 3 });
    Doctor.findByPk.mockResolvedValue({
      id: 3,
      userId: 8,
      specialtyId: 1,
      consultationFee: 1,
      bio: "",
      imgUrl: null,
      User: { name: "A", email: "a@test.com", phone: null },
      Specialty: { id: 1, name: "Umum" },
    });
    await AdminDoctorController.create(
      req({ body: { name: "A", email: "a@test.com", password: "123456", specialtyId: 1, consultationFee: 1 } }),
      mockRes(),
      mockNext()
    );
    const doctor = {
      id: 1,
      userId: 8,
      specialtyId: 1,
      consultationFee: 1,
      bio: "",
      imgUrl: null,
      User: { name: "A", email: "a@test.com", phone: "1", update: jest.fn() },
      update: jest.fn(),
    };
    Doctor.findByPk.mockResolvedValue(doctor);
    await AdminDoctorController.update(req({ params: { id: 1 }, body: {} }), mockRes(), mockNext());

    const sch = { dayOfWeek: 1, session: "morning", startTime: "08:00", endTime: "12:00", quota: 10, update: jest.fn() };
    Schedule.findByPk.mockResolvedValue(sch);
    await AdminScheduleController.update(req({ params: { id: 1 }, body: {} }), mockRes(), mockNext());

    Appointment.findAll.mockResolvedValue([
      {
        id: 1,
        patientId: 10,
        doctorId: 2,
        date: "2026-08-20",
        session: "morning",
        queueNumber: 1,
        status: "booked",
        Patient: { id: 10, name: "Budi" },
        Doctor: null,
      },
    ]);
    await AdminAppointmentController.list(req({ query: {} }), mockRes(), mockNext());

    Doctor.findByPk.mockResolvedValue({
      id: 1,
      bio: "b",
      imgUrl: null,
      consultationFee: 1000,
      User: { name: "dr. A", email: "a@test.com", phone: "081" },
      Specialty: { id: 1, name: "Umum", description: "d" },
      Schedules: [
        { id: 1, dayOfWeek: 1, session: "afternoon", startTime: "13:00", endTime: "17:00", quota: 8 },
        { id: 2, dayOfWeek: 1, session: "morning", startTime: "08:00", endTime: "12:00", quota: 10 },
      ],
    });
    Appointment.findAll.mockResolvedValue([]);
    await DoctorController.detail(req({ params: { id: 1 } }), mockRes(), mockNext());

    Invoice.findByPk.mockResolvedValue({
      id: 1,
      appointmentId: 3,
      amount: 1,
      status: "unpaid",
      Appointment: { patientId: 1, doctorId: 2, Doctor: { userId: 99 } },
    });
    await invoiceController.detail(req({ params: { id: 1 }, user: { id: 20, role: "doctor" } }), mockRes(), mockNext());

    await QueueController.publicBoard(
      req({ params: { doctorId: 1 }, query: { date: "20-08-2026", session: "morning" } }),
      mockRes(),
      mockNext()
    );
  });
});
