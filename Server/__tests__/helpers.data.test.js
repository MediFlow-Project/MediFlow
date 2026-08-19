jest.mock("../models", () => ({
  Appointment: { count: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  Doctor: { findAll: jest.fn() },
  Specialty: {},
  Schedule: {},
  User: {},
}));

const { Appointment, Doctor } = require("../models");
const { getDashboardCounts } = require("../helpers/dashboardCounts");
const {
  countUsedQuota,
  remainingQuota,
  hasActiveDoubleBook,
  isSessionOpen,
  markSessionOpen,
  resetOpenedSessions,
} = require("../helpers/quota");
const { buildQueuePayload } = require("../helpers/queuePayload");
const { getAvailableDoctors, toPublicRecommendation } = require("../helpers/doctorAvailability");
const { todayDateOnly } = require("../helpers/date");

describe("dashboardCounts", () => {
  it("counts bookings and active queues", async () => {
    Appointment.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    const result = await getDashboardCounts("2026-08-20");
    expect(result).toEqual({ bookingsToday: 4, activeQueues: 2 });
  });

  it("defaults to today", async () => {
    Appointment.count.mockResolvedValue(0);
    const result = await getDashboardCounts();
    expect(result.bookingsToday).toBe(0);
    expect(Appointment.count.mock.calls[0][0].where.date).toBe(todayDateOnly());
  });
});

describe("quota", () => {
  beforeEach(() => resetOpenedSessions());

  it("computes remaining quota and double book", async () => {
    Appointment.count.mockResolvedValue(3);
    expect(await countUsedQuota(1, "2026-08-20", "morning")).toBe(3);
    expect(await remainingQuota(1, "2026-08-20", "morning", 10)).toBe(7);
    Appointment.findOne.mockResolvedValue({ id: 1 });
    expect(await hasActiveDoubleBook(1, 2, "2026-08-20", "morning")).toBe(true);
    Appointment.findOne.mockResolvedValue(null);
    expect(await hasActiveDoubleBook(1, 2, "2026-08-20", "morning")).toBe(false);
  });

  it("detects open session from appointments or memory", async () => {
    Appointment.count.mockResolvedValue(1);
    expect(await isSessionOpen(1, "2026-08-20", "morning")).toBe(true);
    Appointment.count.mockResolvedValue(0);
    expect(await isSessionOpen(1, "2026-08-20", "morning")).toBe(false);
    markSessionOpen(1, "2026-08-20", "morning");
    expect(await isSessionOpen(1, "2026-08-20", "morning")).toBe(true);
  });
});

describe("queuePayload", () => {
  it("builds board with masked names", async () => {
    Appointment.findAll.mockResolvedValue([
      { id: 1, queueNumber: 1, status: "waiting", Patient: { name: "Andi Saputra" } },
      { id: 2, queueNumber: 2, status: "called", Patient: { name: "Budi" } },
    ]);
    const payload = await buildQueuePayload(5, "2026-08-20", "morning", { includeAppointmentId: true });
    expect(payload.nowServing).toBe(2);
    expect(payload.items[0].patientNameMasked).toBe("Andi S.");
    expect(payload.items[0].appointmentId).toBe(1);
    const publicBoard = await buildQueuePayload(5, "2026-08-20", "morning");
    expect(publicBoard.items[0].appointmentId).toBeUndefined();
  });

  it("handles empty board", async () => {
    Appointment.findAll.mockResolvedValue([]);
    const payload = await buildQueuePayload(1, "2026-08-20", "afternoon");
    expect(payload.nowServing).toBeNull();
    expect(payload.items).toEqual([]);
  });
});

describe("doctorAvailability", () => {
  it("returns doctors with remaining quota", async () => {
    Appointment.count.mockResolvedValue(0);
    Doctor.findAll.mockResolvedValue([
      {
        id: 1,
        consultationFee: 100000,
        imgUrl: "http://x.test/a.png",
        User: { name: "dr. Sari" },
        Specialty: { name: "Gigi" },
        Schedules: [{ dayOfWeek: new Date().getDay(), session: "morning", quota: 10 }],
      },
      { id: 2, User: null, Specialty: { name: "Umum" }, Schedules: [] },
    ]);
    const result = await getAvailableDoctors();
    expect(result[0].doctorName).toBe("dr. Sari");
    expect(result[0].sessions.length).toBeGreaterThan(0);

    const rec = toPublicRecommendation(
      { doctorId: 1, reason: "gigi", nextSession: result[0].sessions[0] },
      result
    );
    expect(rec.doctorId).toBe(1);
    expect(toPublicRecommendation({ doctorId: 99 }, result)).toBeNull();
    expect(toPublicRecommendation({ doctorId: 1, nextSession: { date: "1999-01-01", session: "morning" } }, result)).toBeNull();
  });

  it("skips full quota sessions", async () => {
    Appointment.count.mockResolvedValue(99);
    Doctor.findAll.mockResolvedValue([
      {
        id: 1,
        User: { name: "dr. A" },
        Specialty: { name: "Umum" },
        Schedules: [{ dayOfWeek: new Date().getDay(), session: "morning", quota: 1 }],
      },
    ]);
    const result = await getAvailableDoctors();
    expect(result).toEqual([]);
  });
});
