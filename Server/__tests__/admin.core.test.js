const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("Admin master data (Raihan)", () => {
  let fx;
  let extraSpecialty;
  let extraDoctor;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("pasien tidak boleh mengakses admin specialties", async () => {
    const res = await request(app)
      .get("/api/admin/specialties")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(403);
  });

  test("admin dapat membuat dan mengubah spesialisasi", async () => {
    const created = await request(app)
      .post("/api/admin/specialties")
      .set(auth(fx.tokens.admin))
      .send({ name: "Jantung", description: "Poli jantung" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Jantung" });
    extraSpecialty = created.body;

    const updated = await request(app)
      .put(`/api/admin/specialties/${extraSpecialty.id}`)
      .set(auth(fx.tokens.admin))
      .send({ name: "Kardiologi", description: "Poli jantung" });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe("Kardiologi");
  });

  test("spesialisasi yang masih dipakai dokter tidak dapat dihapus", async () => {
    const res = await request(app)
      .delete(`/api/admin/specialties/${fx.specialty.id}`)
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Spesialisasi masih dipakai dokter" });
  });

  test("admin dapat menghapus spesialisasi kosong", async () => {
    const res = await request(app)
      .delete(`/api/admin/specialties/${extraSpecialty.id}`)
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Spesialisasi dihapus" });
  });

  test("admin dapat membuat dokter baru", async () => {
    const res = await request(app)
      .post("/api/admin/doctors")
      .set(auth(fx.tokens.admin))
      .send({
        name: "dr. Nina",
        email: "nina@test.com",
        password: "password123",
        phone: "081000000001",
        specialtyId: fx.specialty.id,
        consultationFee: 200000,
        bio: "Dokter baru",
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "dr. Nina",
      email: "nina@test.com",
      consultationFee: 200000,
      specialty: { id: fx.specialty.id, name: "Gigi" },
    });
    extraDoctor = res.body;
  });

  test("admin dapat mengubah data dokter", async () => {
    const res = await request(app)
      .put(`/api/admin/doctors/${extraDoctor.id}`)
      .set(auth(fx.tokens.admin))
      .send({ consultationFee: 210000, name: "dr. Nina Gigi" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: "dr. Nina Gigi",
      consultationFee: 210000,
    });
  });

  test("dokter yang masih punya janji tidak dapat dihapus", async () => {
    const res = await request(app)
      .delete(`/api/admin/doctors/${fx.doctor.id}`)
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Dokter masih memiliki janji temu" });
  });

  test("admin dapat menambah, mengubah, dan menghapus jadwal dokter baru", async () => {
    const created = await request(app)
      .post("/api/admin/schedules")
      .set(auth(fx.tokens.admin))
      .send({
        doctorId: extraDoctor.id,
        dayOfWeek: 1,
        session: "morning",
        startTime: "08:00",
        endTime: "12:00",
        quota: 8,
      });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      doctorId: extraDoctor.id,
      session: "morning",
      quota: 8,
    });

    const updated = await request(app)
      .put(`/api/admin/schedules/${created.body.id}`)
      .set(auth(fx.tokens.admin))
      .send({ quota: 12 });
    expect(updated.status).toBe(200);
    expect(updated.body.quota).toBe(12);

    const listed = await request(app)
      .get("/api/admin/schedules")
      .query({ doctorId: extraDoctor.id })
      .set(auth(fx.tokens.admin));
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);

    const removed = await request(app)
      .delete(`/api/admin/schedules/${created.body.id}`)
      .set(auth(fx.tokens.admin));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: "Jadwal dihapus" });
  });

  test("admin dapat menghapus dokter tanpa janji", async () => {
    const res = await request(app)
      .delete(`/api/admin/doctors/${extraDoctor.id}`)
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Dokter dihapus" });
  });

  test("GET /api/admin/appointments dapat difilter", async () => {
    const invalid = await request(app)
      .get("/api/admin/appointments")
      .query({ date: "20-08-2026" })
      .set(auth(fx.tokens.admin));
    expect(invalid.status).toBe(400);

    const res = await request(app)
      .get("/api/admin/appointments")
      .query({ status: "in_consultation", date: fx.date })
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: fx.inConsultation.id,
      status: "in_consultation",
      patient: expect.objectContaining({ email: "pasien2@test.com" }),
    });
  });
});
