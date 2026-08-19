jest.mock("../models", () => require("./utils").createModelsMock());
jest.mock("../sockets/emit", () => ({
  emitQueueUpdated: jest.fn().mockResolvedValue({ updatedAt: "t" }),
  emitQueueCalled: jest.fn(),
  emitQueueCompleted: jest.fn().mockResolvedValue({}),
  emitChatMessage: jest.fn(),
  emitChatRead: jest.fn(),
  emitChatTyping: jest.fn(),
}));
jest.mock("../helpers/chatbotLlm", () => ({
  recommendWithFallback: jest.fn(),
}));
jest.mock("../helpers/doctorAvailability", () => ({
  getAvailableDoctors: jest.fn(),
  toPublicRecommendation: jest.fn(),
}));
jest.mock("../helpers/midtrans", () => {
  const actual = jest.requireActual("../helpers/midtrans");
  return {
    ...actual,
    createSnapToken: jest.fn(),
    canReuseSnap: jest.fn(),
    verifySignature: jest.fn(),
    amountsMatch: jest.fn(),
    mapNotificationStatus: jest.fn(),
  };
});
jest.mock("../helpers/dashboardCounts", () => ({
  getDashboardCounts: jest.fn().mockResolvedValue({ bookingsToday: 3, activeQueues: 1 }),
}));

const {
  User,
  Doctor,
  Specialty,
  Schedule,
  Appointment,
  Consultation,
  PrescriptionItem,
  Medicine,
  Invoice,
  Message,
  ChatRead,
  sequelize,
} = require("../models");
const AuthController = require("../controllers/authController");
const AppointmentController = require("../controllers/appointmentController");
const QueueController = require("../controllers/queueController");
const SpecialtyController = require("../controllers/specialtyController");
const DoctorController = require("../controllers/doctorController");
const { mockRes, mockNext } = require("./utils");
const { hashPassword } = require("../helpers/bcrypt");
const { todayDateOnly } = require("../helpers/date");

function req(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 10, role: "patient", name: "Budi" },
    doctor: { id: 2, userId: 20, consultationFee: 100000 },
    ...overrides,
  };
}

describe("AuthController", () => {
  it("register validates and creates", async () => {
    const res = mockRes();
    await AuthController.register(req({ body: {} }), res, mockNext());
    User.create.mockResolvedValue({ toSafeJSON: () => ({ id: 1, email: "a@test.com", role: "patient" }) });
    const res2 = mockRes();
    await AuthController.register(
      req({ body: { name: "A", email: "A@test.com", password: "123456", phone: "081" } }),
      res2,
      mockNext()
    );
    expect(res2.status).toHaveBeenCalledWith(201);
    const next = mockNext();
    await AuthController.register(req({ body: { name: "A", email: "a@test.com", password: "1", phone: "081" } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(400);
  });

  it("login success and failure", async () => {
    const next = mockNext();
    await AuthController.login(req({ body: {} }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(400);
    User.findOne.mockResolvedValue(null);
    await AuthController.login(req({ body: { email: "a@test.com", password: "x" } }), mockRes(), mockNext());
    User.findOne.mockResolvedValue({ id: 1, name: "A", email: "a@test.com", role: "patient", passwordHash: hashPassword("password123") });
    const res = mockRes();
    await AuthController.login(req({ body: { email: "a@test.com", password: "password123" } }), res, mockNext());
    expect(res.json.mock.calls[0][0].accessToken).toBeDefined();
  });

  it("me returns doctor payload", async () => {
    User.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await AuthController.me(req(), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(401);
    User.findByPk.mockResolvedValue({
      toSafeJSON: () => ({ id: 2, role: "doctor" }),
      Doctor: { id: 9, specialtyId: 1, consultationFee: 1, bio: "x", imgUrl: null },
    });
    const res = mockRes();
    await AuthController.me(req({ user: { id: 2 } }), res, mockNext());
    expect(res.json.mock.calls[0][0].doctor.id).toBe(9);
  });
});

describe("SpecialtyController", () => {
  it("lists and details", async () => {
    Specialty.findAll.mockResolvedValue([{ id: 1, name: "Gigi", description: "d", imgUrl: "http://x.test/gigi.png", Doctors: [{ id: 1 }] }]);
    const res = mockRes();
    await SpecialtyController.list(req(), res, mockNext());
    expect(res.json.mock.calls[0][0][0].doctorCount).toBe(1);
    expect(res.json.mock.calls[0][0][0].imgUrl).toBe("http://x.test/gigi.png");
    Specialty.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await SpecialtyController.detail(req({ params: { id: 9 } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(404);
    Specialty.findByPk.mockResolvedValue({
      id: 1,
      name: "Gigi",
      description: "d",
      Doctors: [
        {
          id: 2,
          consultationFee: 1,
          bio: "b",
          imgUrl: null,
          User: { name: "dr. A" },
          Schedules: [
            { dayOfWeek: new Date().getDay(), session: "morning", startTime: "08:00", endTime: "12:00", quota: 10 },
            { dayOfWeek: new Date().getDay(), session: "afternoon", startTime: "13:00", endTime: "16:00", quota: 8 },
            { dayOfWeek: new Date().getDay(), session: "evening", startTime: "18:00", endTime: "20:00", quota: 5 },
          ],
        },
      ],
    });
    Appointment.findAll.mockResolvedValue([
      { doctorId: 2, date: todayDateOnly(), session: "morning" },
      { doctorId: 2, date: new Date(`${todayDateOnly()}T00:00:00`), session: "morning" },
    ]);
    const res2 = mockRes();
    await SpecialtyController.detail(req({ params: { id: 1 } }), res2, mockNext());
    expect(res2.json.mock.calls[0][0].doctors[0].name).toBe("dr. A");
    expect(res2.json.mock.calls[0][0].calendar[0].sessions.morning.doctorName).toBe("dr. A");
    expect(res2.json.mock.calls[0][0].calendar[0].sessions.afternoon.doctorName).toBe("dr. A");
    expect(res2.json.mock.calls[0][0].calendar[0].sessions.morning.remainingQuota).toBe(8);
    Specialty.findByPk.mockResolvedValue({ id: 1, name: "Gigi", description: "d" });
    const res3 = mockRes();
    await SpecialtyController.detail(req({ params: { id: 1 } }), res3, mockNext());
    expect(res3.json.mock.calls[0][0].calendar).toEqual([]);
    Specialty.findByPk.mockResolvedValue({
      id: 1,
      name: "Gigi",
      description: "d",
      Doctors: [{ id: 3, consultationFee: 1, User: { name: "dr. B" } }],
    });
    Appointment.findAll.mockResolvedValue(null);
    const res4 = mockRes();
    await SpecialtyController.detail(req({ params: { id: 1 } }), res4, mockNext());
    expect(res4.json.mock.calls[0][0].calendar).toEqual([]);
  });
});

describe("DoctorController", () => {
  it("lists with filters", async () => {
    Doctor.findAll.mockResolvedValue([
      { id: 1, bio: "b", consultationFee: 1, imgUrl: null, User: { name: "dr. A" }, Specialty: { id: 1, name: "Umum" } },
    ]);
    const res = mockRes();
    await DoctorController.list(req({ query: { specialtyId: 1, name: "A" } }), res, mockNext());
    expect(res.json.mock.calls[0][0][0].name).toBe("dr. A");
  });

  it("detail 404 and upcoming sessions", async () => {
    Doctor.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await DoctorController.detail(req({ params: { id: 1 } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(404);
    Doctor.findByPk.mockResolvedValue({
      id: 1,
      bio: "b",
      imgUrl: null,
      consultationFee: 1000,
      User: { name: "dr. A", email: "a@test.com", phone: "081" },
      Specialty: { id: 1, name: "Umum", description: "d" },
      Schedules: [{ id: 1, dayOfWeek: new Date().getDay(), session: "morning", startTime: "08:00", endTime: "12:00", quota: 10 }],
    });
    Appointment.findAll.mockResolvedValue([{ date: "2099-01-01", session: "morning" }]);
    const res = mockRes();
    await DoctorController.detail(req({ params: { id: 1 } }), res, mockNext());
    expect(res.json.mock.calls[0][0].upcomingSessions.length).toBeGreaterThan(0);
  });
});

describe("AppointmentController", () => {
  it("create validates", async () => {
    const next = mockNext();
    await AppointmentController.create(req({ body: {} }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(400);
    await AppointmentController.create(req({ body: { doctorId: 1, date: "bad", session: "morning" } }), mockRes(), mockNext());
    await AppointmentController.create(req({ body: { doctorId: 1, date: "2026-08-20", session: "night" } }), mockRes(), mockNext());
    await AppointmentController.create(req({ body: { doctorId: 1, date: "2000-01-01", session: "morning" } }), mockRes(), mockNext());
  });

  it("create success and conflicts", async () => {
    sequelize.transaction.mockImplementation(async (fn) => fn({ LOCK: { UPDATE: "UPDATE" } }));
    Doctor.findByPk.mockResolvedValue({ id: 2 });
    Schedule.findOne.mockResolvedValue({ quota: 10 });
    Appointment.findOne.mockResolvedValue(null);
    Appointment.count.mockResolvedValue(0);
    Appointment.max.mockResolvedValue(2);
    Appointment.create.mockResolvedValue({ id: 5 });
    Appointment.findByPk.mockResolvedValue({
      id: 5,
      patientId: 10,
      doctorId: 2,
      date: "2099-08-20",
      session: "morning",
      queueNumber: 3,
      status: "booked",
      Doctor: { id: 2, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" }, consultationFee: 1, bio: "", imgUrl: null },
      Patient: { id: 10, name: "Budi" },
    });
    const res = mockRes();
    await AppointmentController.create(
      req({ body: { doctorId: 2, date: "2099-08-20", session: "morning" } }),
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(201);

    Appointment.findByPk.mockResolvedValue({
      id: 6,
      patientId: 10,
      doctorId: 2,
      date: "2099-08-20",
      session: "afternoon",
      queueNumber: 1,
      status: "waiting",
      Doctor: { id: 2, User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" }, consultationFee: 1, bio: "", imgUrl: null },
      Patient: { id: 10, name: "Budi" },
    });
    Appointment.count.mockResolvedValue(1);
    const resOpen = mockRes();
    await AppointmentController.create(
      req({ body: { doctorId: 2, date: "2099-08-20", session: "afternoon" } }),
      resOpen,
      mockNext()
    );
    expect(resOpen.status).toHaveBeenCalledWith(201);

    Doctor.findByPk.mockResolvedValue(null);
    const next404 = mockNext();
    await AppointmentController.create(
      req({ body: { doctorId: 2, date: "2099-08-20", session: "morning" } }),
      mockRes(),
      next404
    );
    expect(next404.mock.calls[0][0].status).toBe(404);

    Doctor.findByPk.mockResolvedValue({ id: 2 });
    Schedule.findOne.mockResolvedValue(null);
    const nextNoSch = mockNext();
    await AppointmentController.create(
      req({ body: { doctorId: 2, date: "2099-08-20", session: "morning" } }),
      mockRes(),
      nextNoSch
    );
    expect(nextNoSch.mock.calls[0][0].status).toBe(400);

    Schedule.findOne.mockResolvedValue({ quota: 10 });
    Appointment.findOne.mockResolvedValue({ id: 99 });
    const next409 = mockNext();
    await AppointmentController.create(
      req({ body: { doctorId: 2, date: "2099-08-20", session: "morning" } }),
      mockRes(),
      next409
    );
    expect(next409.mock.calls[0][0].status).toBe(409);

    Appointment.findOne.mockResolvedValue(null);
    Appointment.count.mockResolvedValue(10);
    const nextFull = mockNext();
    await AppointmentController.create(
      req({ body: { doctorId: 2, date: "2099-08-20", session: "morning" } }),
      mockRes(),
      nextFull
    );
    expect(nextFull.mock.calls[0][0].status).toBe(409);
  });

  it("list detail cancel", async () => {
    Doctor.findOne.mockResolvedValue({ id: 2 });
    Appointment.findAll.mockResolvedValue([]);
    await AppointmentController.list(req({ user: { id: 20, role: "doctor" } }), mockRes(), mockNext());
    await AppointmentController.list(req({ user: { id: 1, role: "admin" } }), mockRes(), mockNext());
    Appointment.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await AppointmentController.detail(req({ params: { id: 1 } }), mockRes(), next);
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
    const res = mockRes();
    await AppointmentController.detail(req({ params: { id: 1 }, user: { id: 10, role: "patient" } }), res, mockNext());
    expect(res.json).toHaveBeenCalled();

    const next403 = mockNext();
    await AppointmentController.cancel(req({ params: { id: 1 }, user: { id: 99, role: "patient" } }), mockRes(), next403);
    expect(next403.mock.calls[0][0].status).toBe(403);

    const appt = {
      id: 1,
      patientId: 10,
      doctorId: 2,
      date: "2026-08-20",
      session: "morning",
      queueNumber: 1,
      status: "called",
      update: jest.fn(),
      Doctor: { userId: 20 },
      Patient: { id: 10, name: "Budi" },
    };
    Appointment.findByPk.mockResolvedValue(appt);
    const next409 = mockNext();
    await AppointmentController.cancel(req({ params: { id: 1 } }), mockRes(), next409);
    expect(next409.mock.calls[0][0].status).toBe(409);

    appt.status = "booked";
    appt.update.mockResolvedValue();
    Appointment.findByPk
      .mockResolvedValueOnce(appt)
      .mockResolvedValueOnce({ ...appt, status: "cancelled", Doctor: { User: { name: "dr. A" }, Specialty: { id: 1, name: "Gigi" } }, Patient: { id: 10, name: "Budi" } });
    const res2 = mockRes();
    await AppointmentController.cancel(req({ params: { id: 1 } }), res2, mockNext());
    expect(res2.json).toHaveBeenCalled();
  });
});

describe("QueueController", () => {
  it("validates date session", async () => {
    const next = mockNext();
    await QueueController.publicBoard(req({ params: { doctorId: 1 }, query: {} }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(400);
  });

  it("public board access", async () => {
    Appointment.findOne.mockResolvedValue({ id: 1 });
    const { buildQueuePayload } = require("../helpers/queuePayload");
    jest.spyOn(require("../helpers/queuePayload"), "buildQueuePayload");
    // already mocked via module? queueController uses real buildQueuePayload
  });
});
