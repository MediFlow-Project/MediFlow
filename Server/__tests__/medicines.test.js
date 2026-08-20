const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("Admin medicines", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("GET /api/admin/medicines tanpa token mengembalikan 401", async () => {
    const res = await request(app).get("/api/admin/medicines");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Silakan login terlebih dahulu" });
  });

  test("GET /api/admin/medicines sebagai pasien mengembalikan 403", async () => {
    const res = await request(app)
      .get("/api/admin/medicines")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Anda tidak memiliki akses" });
  });

  test("GET /api/admin/medicines sebagai dokter mengembalikan katalog", async () => {
    const res = await request(app)
      .get("/api/admin/medicines")
      .set(auth(fx.tokens.doctor));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: fx.medicine.id,
          name: "Paracetamol 500 mg",
          price: 8000,
        }),
      ])
    );
  });

  test("POST /api/admin/medicines sebagai dokter mengembalikan 403", async () => {
    const res = await request(app)
      .post("/api/admin/medicines")
      .set(auth(fx.tokens.doctor))
      .send({ name: "Amoxicillin 500 mg", price: 12000 });
    expect(res.status).toBe(403);
  });

  test("POST /api/admin/medicines menolak payload tidak valid", async () => {
    const res = await request(app)
      .post("/api/admin/medicines")
      .set(auth(fx.tokens.admin))
      .send({ name: "", price: -1 });
    expect(res.status).toBe(400);
  });

  test("admin dapat create, detail, update, dan delete obat", async () => {
    const created = await request(app)
      .post("/api/admin/medicines")
      .set(auth(fx.tokens.admin))
      .send({ name: "Amoxicillin 500 mg", price: 12000 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      name: "Amoxicillin 500 mg",
      price: 12000,
    });

    const detail = await request(app)
      .get(`/api/admin/medicines/${created.body.id}`)
      .set(auth(fx.tokens.admin));
    expect(detail.status).toBe(200);
    expect(detail.body.name).toBe("Amoxicillin 500 mg");

    const updated = await request(app)
      .put(`/api/admin/medicines/${created.body.id}`)
      .set(auth(fx.tokens.admin))
      .send({ name: "Amoxicillin 500 mg", price: 15000 });
    expect(updated.status).toBe(200);
    expect(updated.body.price).toBe(15000);

    const removed = await request(app)
      .delete(`/api/admin/medicines/${created.body.id}`)
      .set(auth(fx.tokens.admin));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: "Obat berhasil dihapus" });

    const missing = await request(app)
      .get(`/api/admin/medicines/${created.body.id}`)
      .set(auth(fx.tokens.admin));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "Obat tidak ditemukan" });
  });
});
