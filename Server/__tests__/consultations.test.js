const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("Complete consultation", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("tanpa token mengembalikan 401", async () => {
    const res = await request(app).post("/api/doctor/consultations/complete").send({});
    expect(res.status).toBe(401);
  });

  test("pasien tidak boleh menyelesaikan konsultasi", async () => {
    const res = await request(app)
      .post("/api/doctor/consultations/complete")
      .set(auth(fx.tokens.patient))
      .send({
        appointmentId: fx.inConsultation.id,
        complaint: "Sakit gigi",
        diagnosis: "Karies",
      });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Hanya dokter yang dapat mengakses" });
  });

  test("dokter lain tidak boleh menyelesaikan janji ini", async () => {
    const res = await request(app)
      .post("/api/doctor/consultations/complete")
      .set(auth(fx.tokens.otherDoctor))
      .send({
        appointmentId: fx.inConsultation.id,
        complaint: "Sakit gigi",
        diagnosis: "Karies",
      });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Anda tidak memiliki akses" });
  });

  test("status booked menolak complete dengan 409", async () => {
    const res = await request(app)
      .post("/api/doctor/consultations/complete")
      .set(auth(fx.tokens.doctor))
      .send({
        appointmentId: fx.booked.id,
        complaint: "Sakit gigi",
        diagnosis: "Karies",
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/in_consultation/);
  });

  test("menolak jika keluhan atau diagnosa kosong", async () => {
    const res = await request(app)
      .post("/api/doctor/consultations/complete")
      .set(auth(fx.tokens.doctor))
      .send({
        appointmentId: fx.inConsultation.id,
        complaint: "  ",
        diagnosis: "Karies",
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Keluhan wajib diisi" });
  });

  test("menyelesaikan konsultasi dan membuat invoice fee + obat", async () => {
    const res = await request(app)
      .post("/api/doctor/consultations/complete")
      .set(auth(fx.tokens.doctor))
      .send({
        appointmentId: fx.inConsultation.id,
        complaint: "Sakit gigi",
        diagnosis: "Karies",
        notes: "Kontrol 1 minggu",
        items: [
          {
            medicineId: fx.medicine.id,
            quantity: 2,
            dosage: "3x1 sesudah makan",
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("completed");
    expect(res.body.appointmentId).toBe(fx.inConsultation.id);
    expect(res.body.consultation).toMatchObject({
      complaint: "Sakit gigi",
      diagnosis: "Karies",
      notes: "Kontrol 1 minggu",
    });
    expect(res.body.consultation.items).toHaveLength(1);
    expect(res.body.invoice.status).toBe("unpaid");
    expect(res.body.invoice.amount).toBe(150000 + 8000 * 2);
  });

  test("complete kedua kali pada janji yang sama mengembalikan 409", async () => {
    const res = await request(app)
      .post("/api/doctor/consultations/complete")
      .set(auth(fx.tokens.doctor))
      .send({
        appointmentId: fx.inConsultation.id,
        complaint: "Sakit gigi",
        diagnosis: "Karies",
      });
    expect(res.status).toBe(409);
  });
});
