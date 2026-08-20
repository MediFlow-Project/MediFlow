const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("REST chat", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("GET /api/chats tanpa token mengembalikan 401", async () => {
    const res = await request(app).get("/api/chats");
    expect(res.status).toBe(401);
  });

  test("admin tidak boleh mengakses inbox chat", async () => {
    const res = await request(app).get("/api/chats").set(auth(fx.tokens.admin));
    expect(res.status).toBe(403);
  });

  test("pasien lain tidak boleh kirim pesan di thread ini", async () => {
    const res = await request(app)
      .post(`/api/appointments/${fx.booked.id}/messages`)
      .set(auth(fx.tokens.otherPatient))
      .send({ body: "Halo dokter" });
    expect(res.status).toBe(403);
  });

  test("pasien dapat mengirim pesan pada janji booked", async () => {
    const res = await request(app)
      .post(`/api/appointments/${fx.booked.id}/messages`)
      .set(auth(fx.tokens.patient))
      .send({ body: "Halo dokter, gigi saya sakit" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      appointmentId: fx.booked.id,
      senderId: fx.patient.id,
      senderRole: "patient",
      body: "Halo dokter, gigi saya sakit",
    });
  });

  test("pesan kosong ditolak", async () => {
    const res = await request(app)
      .post(`/api/appointments/${fx.booked.id}/messages`)
      .set(auth(fx.tokens.patient))
      .send({ body: "   " });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Pesan tidak boleh kosong" });
  });

  test("dokter membalas dan inbox pasien menampilkan unreadCount", async () => {
    const reply = await request(app)
      .post(`/api/appointments/${fx.booked.id}/messages`)
      .set(auth(fx.tokens.doctor))
      .send({ body: "Silakan datang sesuai antrian" });
    expect(reply.status).toBe(201);

    const inbox = await request(app).get("/api/chats").set(auth(fx.tokens.patient));
    expect(inbox.status).toBe(200);
    const thread = inbox.body.find((item) => item.appointmentId === fx.booked.id);
    expect(thread).toMatchObject({
      counterpartName: "dr. Sari Gigi",
      unreadCount: 1,
      lastMessage: expect.objectContaining({ body: "Silakan datang sesuai antrian" }),
    });
  });

  test("mark read mengosongkan unreadCount", async () => {
    const read = await request(app)
      .post(`/api/appointments/${fx.booked.id}/messages/read`)
      .set(auth(fx.tokens.patient));
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({
      appointmentId: fx.booked.id,
      userId: fx.patient.id,
    });

    const inbox = await request(app).get("/api/chats").set(auth(fx.tokens.patient));
    const thread = inbox.body.find((item) => item.appointmentId === fx.booked.id);
    expect(thread.unreadCount).toBe(0);
  });

  test("GET messages mengembalikan riwayat terurut", async () => {
    const res = await request(app)
      .get(`/api/appointments/${fx.booked.id}/messages`)
      .set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body.map((item) => item.body)).toEqual([
      "Halo dokter, gigi saya sakit",
      "Silakan datang sesuai antrian",
    ]);
  });

  test("chat ditutup setelah appointment completed", async () => {
    const res = await request(app)
      .post(`/api/appointments/${fx.completed.id}/messages`)
      .set(auth(fx.tokens.patient))
      .send({ body: "Masih boleh chat?" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Chat sudah ditutup" });
  });
});
