const request = require("supertest");
const { app, emit } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");
const { addDays } = require("../tests/helpers/date");
const { hashPassword } = require("../helpers/bcrypt");
const db = require("../models");

describe("Antrean dan aksi dokter (Raihan)", () => {
  let fx;
  let tomorrow;
  let first;
  let second;
  let strangerToken;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
    tomorrow = addDays(fx.date, 1);

    const passwordHash = hashPassword("password123");
    const stranger = await db.User.create({
      name: "Citra Luar",
      email: "citra.luar@test.com",
      passwordHash,
      phone: "081999999999",
      role: "patient",
    });
    const { tokenFor } = require("../tests/helpers/seed");
    strangerToken = tokenFor(stranger);

    const bookedA = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.patient))
      .send({
        doctorId: fx.otherDoctor.id,
        date: tomorrow,
        session: "afternoon",
      });
    const bookedB = await request(app)
      .post("/api/appointments")
      .set(auth(fx.tokens.otherPatient))
      .send({
        doctorId: fx.otherDoctor.id,
        date: tomorrow,
        session: "afternoon",
      });
    first = bookedA.body;
    second = bookedB.body;
  });

  test("pasien tanpa janji tidak boleh melihat board", async () => {
    const res = await request(app)
      .get(`/api/queues/${fx.otherDoctor.id}`)
      .query({ date: tomorrow, session: "afternoon" })
      .set(auth(strangerToken));
    expect(res.status).toBe(403);
  });

  test("query board tanpa date/session mengembalikan 400", async () => {
    const res = await request(app)
      .get(`/api/queues/${fx.otherDoctor.id}`)
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "date dan session wajib diisi" });
  });

  test("pemilik janji dapat melihat board dengan nama tersamarkan", async () => {
    const res = await request(app)
      .get(`/api/queues/${fx.otherDoctor.id}`)
      .query({ date: tomorrow, session: "afternoon" })
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      doctorId: fx.otherDoctor.id,
      date: tomorrow,
      session: "afternoon",
      nowServing: null,
    });
    expect(res.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          queueNumber: 1,
          patientNameMasked: "Andi P.",
          status: "booked",
        }),
        expect.objectContaining({
          queueNumber: 2,
          patientNameMasked: "Budi P.",
          status: "booked",
        }),
      ])
    );
  });

  test("pasien tidak boleh membuka sesi", async () => {
    const res = await request(app)
      .post("/api/doctor/sessions/open")
      .set(auth(fx.tokens.patient))
      .send({ date: tomorrow, session: "afternoon" });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Hanya dokter yang dapat mengakses" });
  });

  test("panggil sebelum ada waiting mengembalikan 409", async () => {
    const res = await request(app)
      .post("/api/doctor/queues/call")
      .set(auth(fx.tokens.otherDoctor))
      .send({ date: tomorrow, session: "afternoon" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Tidak ada pasien dalam antrean" });
  });

  test("dokter membuka sesi mengubah booked menjadi waiting", async () => {
    const res = await request(app)
      .post("/api/doctor/sessions/open")
      .set(auth(fx.tokens.otherDoctor))
      .send({ date: tomorrow, session: "afternoon" });
    expect(res.status).toBe(200);
    expect(res.body.items.every((item) => item.status === "waiting")).toBe(true);
    expect(emit.emitQueueUpdated).toHaveBeenCalled();
  });

  test("GET /api/doctor/queues menampilkan board dokter", async () => {
    const res = await request(app)
      .get("/api/doctor/queues")
      .query({ date: tomorrow, session: "afternoon" })
      .set(auth(fx.tokens.otherDoctor));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toHaveProperty("appointmentId");
  });

  test("panggil pasien berikutnya menjadi called", async () => {
    emit.emitQueueCalled.mockClear();
    const res = await request(app)
      .post("/api/doctor/queues/call")
      .set(auth(fx.tokens.otherDoctor))
      .send({ date: tomorrow, session: "afternoon" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      appointmentId: first.id,
      queueNumber: 1,
      status: "called",
    });
    expect(emit.emitQueueCalled).toHaveBeenCalled();
  });

  test("tidak dapat panggil lagi saat masih ada pasien called", async () => {
    const res = await request(app)
      .post("/api/doctor/queues/call")
      .set(auth(fx.tokens.otherDoctor))
      .send({ date: tomorrow, session: "afternoon" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "Masih ada pasien yang sedang dipanggil atau berkonsultasi",
    });
  });

  test("start consult hanya dari status called", async () => {
    const tooEarly = await request(app)
      .post("/api/doctor/consultations/start")
      .set(auth(fx.tokens.otherDoctor))
      .send({ appointmentId: second.id });
    expect(tooEarly.status).toBe(409);
    expect(tooEarly.body).toEqual({
      error: "Konsultasi hanya dapat dimulai dari status called",
    });

    const started = await request(app)
      .post("/api/doctor/consultations/start")
      .set(auth(fx.tokens.otherDoctor))
      .send({ appointmentId: first.id });
    expect(started.status).toBe(200);
    expect(started.body).toMatchObject({
      appointmentId: first.id,
      status: "in_consultation",
    });
  });

  test("skip pasien waiting menjadi no_show", async () => {
    const res = await request(app)
      .post("/api/doctor/queues/skip")
      .set(auth(fx.tokens.otherDoctor))
      .send({ appointmentId: second.id });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      appointmentId: second.id,
      status: "no_show",
    });
  });

  test("pasien in_consultation tidak dapat dilewati", async () => {
    const res = await request(app)
      .post("/api/doctor/queues/skip")
      .set(auth(fx.tokens.otherDoctor))
      .send({ appointmentId: first.id });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Pasien ini tidak dapat dilewati" });
  });

  test("dokter lain tidak boleh skip janji ini", async () => {
    const res = await request(app)
      .post("/api/doctor/queues/skip")
      .set(auth(fx.tokens.doctor))
      .send({ appointmentId: first.id });
    expect(res.status).toBe(403);
  });

  test("GET /api/doctor/sessions/today menampilkan sisa kuota hari ini", async () => {
    const res = await request(app)
      .get("/api/doctor/sessions/today")
      .set(auth(fx.tokens.doctor));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: fx.date,
          session: "morning",
          quota: 10,
          isOpen: true,
        }),
        expect.objectContaining({
          date: fx.date,
          session: "afternoon",
          quota: 10,
          isOpen: true,
        }),
      ])
    );
  });
});
