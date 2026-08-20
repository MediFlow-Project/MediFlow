const request = require("supertest");
const { app, recommendWithFallback } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("Chatbot recommend", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  afterEach(() => {
    recommendWithFallback.mockReset();
    recommendWithFallback.mockResolvedValue({
      reply: "Rekomendasi tes",
      recommendations: [],
    });
  });

  test("tanpa token mengembalikan 401", async () => {
    const res = await request(app)
      .post("/api/chatbot/recommend")
      .send({ message: "Sakit gigi" });
    expect(res.status).toBe(401);
  });

  test("dokter tidak boleh memakai chatbot", async () => {
    const res = await request(app)
      .post("/api/chatbot/recommend")
      .set(auth(fx.tokens.doctor))
      .send({ message: "Sakit gigi" });
    expect(res.status).toBe(403);
  });

  test("keluhan kosong mengembalikan 400", async () => {
    const res = await request(app)
      .post("/api/chatbot/recommend")
      .set(auth(fx.tokens.patient))
      .send({ message: "  " });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Keluhan wajib diisi" });
  });

  test("mengembalikan disclaimer dan rekomendasi dokter tersedia", async () => {
    recommendWithFallback.mockResolvedValue({
      reply: "Coba ke poli gigi",
      recommendations: [
        {
          doctorId: fx.doctor.id,
          reason: "Keluhan sesuai poli gigi",
          nextSession: { date: fx.date, session: "morning" },
        },
      ],
    });

    const res = await request(app)
      .post("/api/chatbot/recommend")
      .set(auth(fx.tokens.patient))
      .send({ message: "Gigi geraham saya nyeri" });

    expect(res.status).toBe(200);
    expect(res.body.disclaimer).toMatch(/bukan pengganti opini medis/i);
    expect(res.body.reply).toBe("Coba ke poli gigi");
    expect(res.body.recommendations).toEqual([
      expect.objectContaining({
        doctorId: fx.doctor.id,
        doctorName: "dr. Sari Gigi",
        specialtyName: "Gigi",
        reason: "Keluhan sesuai poli gigi",
        nextSession: { date: fx.date, session: "morning" },
      }),
    ]);
    expect(recommendWithFallback).toHaveBeenCalled();
  });
});
