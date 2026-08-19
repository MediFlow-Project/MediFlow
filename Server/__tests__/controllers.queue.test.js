jest.mock("../models", () => require("./utils").createModelsMock());
jest.mock("../sockets/emit", () => ({
  emitQueueUpdated: jest.fn().mockResolvedValue({ updatedAt: "t" }),
  emitQueueCalled: jest.fn(),
  emitQueueCompleted: jest.fn().mockResolvedValue({}),
}));
jest.mock("../helpers/queuePayload", () => ({
  buildQueuePayload: jest.fn().mockResolvedValue({
    doctorId: 2,
    date: "2026-08-20",
    session: "morning",
    nowServing: null,
    items: [],
  }),
}));
jest.mock("../helpers/quota", () => {
  const actual = jest.requireActual("../helpers/quota");
  return {
    ...actual,
    remainingQuota: jest.fn().mockResolvedValue(8),
    isSessionOpen: jest.fn().mockResolvedValue(false),
    markSessionOpen: jest.fn(),
  };
});

const { Appointment, Schedule } = require("../models");
const QueueController = require("../controllers/queueController");
const { mockRes, mockNext } = require("./utils");
const { emitQueueCalled, emitQueueUpdated } = require("../sockets/emit");

function req(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 10, role: "patient" },
    doctor: { id: 2, userId: 20 },
    ...overrides,
  };
}

describe("QueueController", () => {
  it("rejects invalid session", async () => {
    const next = mockNext();
    await QueueController.publicBoard(
      req({ params: { doctorId: 1 }, query: { date: "2026-08-20", session: "eve" } }),
      mockRes(),
      next
    );
    expect(next.mock.calls[0][0].status).toBe(400);
  });

  it("public board patient/doctor/admin", async () => {
    Appointment.findOne.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await QueueController.publicBoard(
      req({ params: { doctorId: 2 }, query: { date: "2026-08-20", session: "morning" } }),
      res,
      mockNext()
    );
    expect(res.json).toHaveBeenCalled();

    const next = mockNext();
    Appointment.findOne.mockResolvedValue(null);
    await QueueController.publicBoard(
      req({ params: { doctorId: 2 }, query: { date: "2026-08-20", session: "morning" } }),
      mockRes(),
      next
    );
    expect(next.mock.calls[0][0].status).toBe(403);

    const { Doctor } = require("../models");
    Doctor.findOne.mockResolvedValue({ id: 2 });
    const res2 = mockRes();
    await QueueController.publicBoard(
      req({
        params: { doctorId: 2 },
        query: { date: "2026-08-20", session: "morning" },
        user: { id: 20, role: "doctor" },
      }),
      res2,
      mockNext()
    );
    expect(res2.json).toHaveBeenCalled();

    Doctor.findOne.mockResolvedValue({ id: 9 });
    const next2 = mockNext();
    await QueueController.publicBoard(
      req({
        params: { doctorId: 2 },
        query: { date: "2026-08-20", session: "morning" },
        user: { id: 20, role: "doctor" },
      }),
      mockRes(),
      next2
    );
    expect(next2.mock.calls[0][0].status).toBe(403);

    const res3 = mockRes();
    await QueueController.publicBoard(
      req({
        params: { doctorId: 2 },
        query: { date: "2026-08-20", session: "morning" },
        user: { id: 1, role: "admin" },
      }),
      res3,
      mockNext()
    );
    expect(res3.json).toHaveBeenCalled();

    const next3 = mockNext();
    await QueueController.publicBoard(
      req({
        params: { doctorId: 2 },
        query: { date: "2026-08-20", session: "morning" },
        user: { id: 1, role: "nurse" },
      }),
      mockRes(),
      next3
    );
    expect(next3.mock.calls[0][0].status).toBe(403);
  });

  it("sessionsToday", async () => {
    Schedule.findAll.mockResolvedValue([
      { session: "morning", startTime: "08:00", endTime: "12:00", quota: 10 },
    ]);
    Appointment.findAll.mockResolvedValue([{ status: "booked" }, { status: "waiting" }, { status: "called" }]);
    const res = mockRes();
    await QueueController.sessionsToday(req(), res, mockNext());
    expect(res.json.mock.calls[0][0][0].bookedCount).toBe(1);
  });

  it("openSession", async () => {
    const next = mockNext();
    await QueueController.openSession(req({ body: { date: "2000-01-01", session: "morning" } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(400);
    Schedule.findOne.mockResolvedValue(null);
    const next2 = mockNext();
    await QueueController.openSession(req({ body: { date: "2099-08-20", session: "morning" } }), mockRes(), next2);
    expect(next2.mock.calls[0][0].status).toBe(400);
    Schedule.findOne.mockResolvedValue({ id: 1 });
    Appointment.update.mockResolvedValue([1]);
    const res = mockRes();
    await QueueController.openSession(req({ body: { date: "2099-08-20", session: "morning" } }), res, mockNext());
    expect(res.json).toHaveBeenCalled();
  });

  it("doctorBoard", async () => {
    const res = mockRes();
    await QueueController.doctorBoard(req({ query: { date: "2026-08-20", session: "morning" } }), res, mockNext());
    expect(res.json).toHaveBeenCalled();
  });

  it("callNext busy empty and success", async () => {
    Appointment.findOne.mockResolvedValueOnce({ id: 1, status: "called" });
    const next = mockNext();
    await QueueController.callNext(req({ body: { date: "2026-08-20", session: "morning" } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(409);

    Appointment.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const next2 = mockNext();
    await QueueController.callNext(req({ body: { date: "2026-08-20", session: "morning" } }), mockRes(), next2);
    expect(next2.mock.calls[0][0].status).toBe(409);

    const nextPatient = { id: 5, queueNumber: 3, update: jest.fn() };
    Appointment.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(nextPatient);
    const res = mockRes();
    await QueueController.callNext(req({ body: { date: "2026-08-20", session: "morning" } }), res, mockNext());
    expect(emitQueueCalled).toHaveBeenCalled();
    expect(emitQueueUpdated).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].queueNumber).toBe(3);
  });

  it("skip and startConsult", async () => {
    Appointment.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await QueueController.skip(req({ body: {} }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(400);
    await QueueController.skip(req({ body: { appointmentId: 1 } }), mockRes(), mockNext());
    Appointment.findByPk.mockResolvedValue({ id: 1, doctorId: 9, status: "waiting" });
    const next403 = mockNext();
    await QueueController.skip(req({ body: { appointmentId: 1 } }), mockRes(), next403);
    expect(next403.mock.calls[0][0].status).toBe(403);
    const appt = { id: 1, doctorId: 2, queueNumber: 1, status: "booked", date: "2026-08-20", session: "morning", update: jest.fn() };
    Appointment.findByPk.mockResolvedValue(appt);
    const next409 = mockNext();
    await QueueController.skip(req({ body: { appointmentId: 1 } }), mockRes(), next409);
    expect(next409.mock.calls[0][0].status).toBe(409);
    appt.status = "waiting";
    const res = mockRes();
    await QueueController.skip(req({ body: { appointmentId: 1 } }), res, mockNext());
    expect(res.json.mock.calls[0][0].status).toBe("no_show");

    const nextStart = mockNext();
    await QueueController.startConsult(req({ body: {} }), mockRes(), nextStart);
    Appointment.findByPk.mockResolvedValue(null);
    await QueueController.startConsult(req({ body: { appointmentId: 1 } }), mockRes(), mockNext());
    Appointment.findByPk.mockResolvedValue({ id: 1, doctorId: 9, status: "called" });
    const next403b = mockNext();
    await QueueController.startConsult(req({ body: { appointmentId: 1 } }), mockRes(), next403b);
    expect(next403b.mock.calls[0][0].status).toBe(403);
    const called = { id: 1, doctorId: 2, queueNumber: 4, status: "waiting", date: "d", session: "morning", update: jest.fn() };
    Appointment.findByPk.mockResolvedValue(called);
    const next409b = mockNext();
    await QueueController.startConsult(req({ body: { appointmentId: 1 } }), mockRes(), next409b);
    called.status = "called";
    const res2 = mockRes();
    await QueueController.startConsult(req({ body: { appointmentId: 1 } }), res2, mockNext());
    expect(res2.json.mock.calls[0][0].status).toBe("in_consultation");
  });
});
