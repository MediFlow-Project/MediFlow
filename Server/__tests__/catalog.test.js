const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");

describe("Katalog publik specialties dan doctors (Raihan)", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("GET /api/specialties menampilkan jumlah dokter", async () => {
    const res = await request(app).get("/api/specialties");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        id: fx.specialty.id,
        name: "Gigi",
        description: "Poli gigi",
        doctorCount: 2,
      }),
    ]);
  });

  test("GET /api/specialties/:id menyertakan daftar dokter", async () => {
    const res = await request(app).get(`/api/specialties/${fx.specialty.id}`);
    expect(res.status).toBe(200);
    expect(res.body.doctors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: fx.doctor.id, name: "dr. Sari Gigi" }),
        expect.objectContaining({ id: fx.otherDoctor.id, name: "dr. Budi Umum" }),
      ])
    );
  });

  test("GET /api/specialties/:id tidak ditemukan", async () => {
    const res = await request(app).get("/api/specialties/99999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Spesialisasi tidak ditemukan" });
  });

  test("GET /api/doctors dapat difilter nama dan specialty", async () => {
    const byName = await request(app).get("/api/doctors").query({ name: "Sari" });
    expect(byName.status).toBe(200);
    expect(byName.body).toHaveLength(1);
    expect(byName.body[0]).toMatchObject({
      id: fx.doctor.id,
      name: "dr. Sari Gigi",
      consultationFee: 150000,
      specialty: { id: fx.specialty.id, name: "Gigi" },
    });

    const bySpecialty = await request(app)
      .get("/api/doctors")
      .query({ specialtyId: fx.specialty.id });
    expect(bySpecialty.status).toBe(200);
    expect(bySpecialty.body).toHaveLength(2);
  });

  test("GET /api/doctors/:id menyertakan jadwal dan sisa kuota", async () => {
    const res = await request(app).get(`/api/doctors/${fx.doctor.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: fx.doctor.id,
      name: "dr. Sari Gigi",
      consultationFee: 150000,
    });
    expect(res.body.schedules.length).toBeGreaterThan(0);
    const todayMorning = res.body.upcomingSessions.find(
      (item) => item.date === fx.date && item.session === "morning"
    );
    expect(todayMorning.quota).toBe(10);
    expect(todayMorning.remainingQuota).toBe(8);
  });

  test("GET /api/doctors/:id tidak ditemukan", async () => {
    const res = await request(app).get("/api/doctors/99999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Dokter tidak ditemukan" });
  });
});
