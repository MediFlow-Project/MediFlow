const request = require("supertest");
const { app, createSnapToken } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");
const { signedNotification } = require("../tests/helpers/midtransPayload");
const { Invoice } = require("../models");

describe("Invoices dan webhook Midtrans", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("GET invoice tanpa token mengembalikan 401", async () => {
    const res = await request(app).get(`/api/invoices/${fx.unpaidInvoice.id}`);
    expect(res.status).toBe(401);
  });

  test("pasien lain tidak boleh melihat invoice", async () => {
    const res = await request(app)
      .get(`/api/invoices/${fx.unpaidInvoice.id}`)
      .set(auth(fx.tokens.otherPatient));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Anda tidak memiliki akses" });
  });

  test("pemilik invoice dapat melihat detail", async () => {
    const res = await request(app)
      .get(`/api/invoices/${fx.unpaidInvoice.id}`)
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: fx.unpaidInvoice.id,
      amount: 158000,
      status: "unpaid",
    });
  });

  test("dokter yang menangani dapat melihat invoice", async () => {
    const res = await request(app)
      .get(`/api/invoices/${fx.unpaidInvoice.id}`)
      .set(auth(fx.tokens.doctor));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(fx.unpaidInvoice.id);
  });

  test("invoice tidak ditemukan mengembalikan 404", async () => {
    const res = await request(app)
      .get("/api/invoices/99999")
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Tagihan tidak ditemukan" });
  });

  test("POST pay mengembalikan snapToken mock", async () => {
    createSnapToken.mockClear();
    const res = await request(app)
      .post(`/api/invoices/${fx.unpaidInvoice.id}/pay`)
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      snapToken: "snap-test-token",
      clientKey: "SB-Mid-client-test",
    });
    expect(createSnapToken).toHaveBeenCalled();

    const invoice = await Invoice.findByPk(fx.unpaidInvoice.id);
    expect(invoice.status).toBe("pending");
    expect(invoice.midtransOrderId).toBe(`MEDIFLOW-${fx.unpaidInvoice.id}`);
  });

  test("dokter tidak boleh membayar invoice", async () => {
    const res = await request(app)
      .post(`/api/invoices/${fx.unpaidInvoice.id}/pay`)
      .set(auth(fx.tokens.doctor));
    expect(res.status).toBe(403);
  });

  test("tagihan yang sudah paid menolak pay dengan 409", async () => {
    const res = await request(app)
      .post(`/api/invoices/${fx.paidInvoice.id}/pay`)
      .set(auth(fx.tokens.otherPatient));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Tagihan sudah dibayar" });
  });

  test("webhook menolak signature tidak valid", async () => {
    const res = await request(app)
      .post("/api/payments/midtrans/notification")
      .send({
        order_id: `MEDIFLOW-${fx.unpaidInvoice.id}`,
        status_code: "200",
        gross_amount: "158000.00",
        signature_key: "invalid",
        transaction_status: "settlement",
      });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Signature Midtrans tidak valid" });
  });

  test("webhook settlement menandai invoice paid", async () => {
    const res = await request(app)
      .post("/api/payments/midtrans/notification")
      .send(
        signedNotification({
          order_id: `MEDIFLOW-${fx.unpaidInvoice.id}`,
          gross_amount: "158000.00",
          transaction_status: "settlement",
        })
      );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const invoice = await Invoice.findByPk(fx.unpaidInvoice.id);
    expect(invoice.status).toBe("paid");
  });

  test("webhook idempotent jika invoice sudah paid", async () => {
    const res = await request(app)
      .post("/api/payments/midtrans/notification")
      .send(
        signedNotification({
          order_id: "MEDIFLOW-PAID",
          gross_amount: "150000.00",
          transaction_status: "settlement",
        })
      );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});
