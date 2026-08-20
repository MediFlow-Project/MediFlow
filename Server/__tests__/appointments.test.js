const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");
const { addDays } = require("../tests/helpers/date");
const { dayOfWeekFromDate } = require("../helpers/date");
const { hashPassword } = require("../helpers/bcrypt");
const db = require("../models");

describe("Appointments pasien (Raihan)", () => {
  let fx;
  let tomorrow;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
    tomorrow = addDays(fx.date, 1);
  });

  test("tanpa token mengembalikan 401", async () => {
    const res = await request(app).post("/api/appointments").send({
      doctorId: fx.doctor.id,
      date: tomorrow,
      session: "morning",
    });
    expect(res.status).toBe(401);
  });

  test("dokter tidak boleh membuat janji", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.doctor))
      .send({
        doctorId: fx.doctor.id,
        date: tomorrow,
        session: "morning",
      });
    expect(res.status).toBe(403);
  });

  test("menolak tanggal lampau dan session tidak valid", async () => {
    const past = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.patient))
      .send({
        doctorId: fx.doctor.id,
        date: "2020-01-01",
        session: "morning",
      });
    expect(past.status).toBe(400);
    expect(past.body).toEqual({
      error: "Tidak dapat booking untuk tanggal yang sudah lewat",
    });

    const session = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.patient))
      .send({
        doctorId: fx.doctor.id,
        date: tomorrow,
        session: "evening",
      });
    expect(session.status).toBe(400);
    expect(session.body).toEqual({ error: "Session harus morning atau afternoon" });
  });

  test("pasien dapat booking dan mendapat nomor antrean", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.patient))
      .send({
        doctorId: fx.doctor.id,
        date: tomorrow,
        session: "morning",
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      patientId: fx.patient.id,
      doctorId: fx.doctor.id,
      date: tomorrow,
      session: "morning",
      queueNumber: 1,
      status: "booked",
    });
    fx.tomorrowBooked = res.body;
  });

  test("double book tanggal dan sesi yang sama mengembalikan 409", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.patient))
      .send({
        doctorId: fx.doctor.id,
        date: tomorrow,
        session: "morning",
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/sudah memiliki janji/);
  });

  test("kuota penuh mengembalikan 409", async () => {
    const passwordHash = hashPassword("password123");
    const user = await db.User.create({
      name: "dr. Kuota",
      email: "kuota@test.com",
      passwordHash,
      phone: "081888888888",
      role: "doctor",
    });
    const doctor = await db.Doctor.create({
      userId: user.id,
      specialtyId: fx.specialty.id,
      consultationFee: 50000,
      bio: "Kuota 1",
    });
    await db.Schedule.create({
      doctorId: doctor.id,
      dayOfWeek: dayOfWeekFromDate(tomorrow),
      session: "morning",
      startTime: "08:00",
      endTime: "12:00",
      quota: 1,
    });

    const first = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.patient))
      .send({
        doctorId: doctor.id,
        date: tomorrow,
        session: "morning",
      });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.otherPatient))
      .send({
        doctorId: doctor.id,
        date: tomorrow,
        session: "morning",
      });
    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: "Kuota sesi ini sudah penuh" });
  });

  test("GET list pasien hanya janji miliknya", async () => {
    const res = await request(app)
      .get("/api/appointments")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body.every((item) => item.patientId === fx.patient.id)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test("pasien lain tidak boleh melihat detail janji", async () => {
    const res = await request(app)
      .get(`/api/appointments/${fx.booked.id}`)
      .set(auth(fx.tokens.otherPatient));
    expect(res.status).toBe(403);
  });

  test("pemilik dan dokter dapat melihat detail", async () => {
    const patient = await request(app)
      .get(`/api/appointments/${fx.booked.id}`)
      .set(auth(fx.tokens.patient));
    expect(patient.status).toBe(200);
    expect(patient.body.id).toBe(fx.booked.id);

    const doctor = await request(app)
      .get(`/api/appointments/${fx.booked.id}`)
      .set(auth(fx.tokens.doctor));
    expect(doctor.status).toBe(200);
  });

  test("janji tidak ditemukan mengembalikan 404", async () => {
    const res = await request(app)
      .get("/api/appointments/99999")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Janji temu tidak ditemukan" });
  });

  test("pasien dapat membatalkan janji booked", async () => {
    const res = await request(app)
      .patch(`/api/appointments/${fx.booked.id}/cancel`)
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });

  test("pasien lain tidak boleh membatalkan janji", async () => {
    const res = await request(app)
      .patch(`/api/appointments/${fx.tomorrowBooked.id}/cancel`)
      .set(auth(fx.tokens.otherPatient));
    expect(res.status).toBe(403);
  });

  test("janji in_consultation tidak dapat dibatalkan", async () => {
    const res = await request(app)
      .patch(`/api/appointments/${fx.inConsultation.id}/cancel`)
      .set(auth(fx.tokens.otherPatient));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "Janji tidak dapat dibatalkan karena sudah dipanggil",
    });
  });
});
