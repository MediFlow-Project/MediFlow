const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("Admin dashboard dan invoices", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("pasien tidak boleh melihat dashboard", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(403);
  });

  test("admin mendapat bookingsToday dan activeQueues", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      bookingsToday: 5,
      activeQueues: 1,
    });
  });

  test("pasien tidak boleh melihat daftar invoice admin", async () => {
    const res = await request(app)
      .get("/api/admin/invoices")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(403);
  });

  test("admin dapat memfilter invoice by status", async () => {
    const invalid = await request(app)
      .get("/api/admin/invoices")
      .query({ status: "unknown" })
      .set(auth(fx.tokens.admin));
    expect(invalid.status).toBe(400);

    const res = await request(app)
      .get("/api/admin/invoices")
      .query({ status: "unpaid" })
      .set(auth(fx.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: fx.unpaidInvoice.id,
      amount: 158000,
      status: "unpaid",
      patient: expect.objectContaining({ email: "pasien@test.com" }),
      doctor: expect.objectContaining({ name: "dr. Sari Gigi" }),
    });
  });
});
