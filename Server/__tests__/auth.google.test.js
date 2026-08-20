jest.mock("../helpers/googleAuth", () => ({
  verifyGoogleIdToken: jest.fn(),
}));

const request = require("supertest");
const { app } = require("../tests/loadApp");
const { verifyGoogleIdToken } = require("../helpers/googleAuth");
const HttpError = require("../helpers/HttpError");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { User } = require("../models");

describe("Auth Google", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("menolak tanpa idToken", async () => {
    const res = await request(app).post("/api/auth/google").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Token Google wajib diisi" });
  });

  test("menolak token Google tidak valid", async () => {
    verifyGoogleIdToken.mockRejectedValueOnce(new HttpError(401, "Token Google tidak valid"));
    const res = await request(app).post("/api/auth/google").send({ idToken: "bad" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Token Google tidak valid" });
  });

  test("login akun pasien yang sudah ada", async () => {
    verifyGoogleIdToken.mockResolvedValueOnce({
      email: "pasien@test.com",
      name: "Andi Pasien",
    });
    const res = await request(app).post("/api/auth/google").send({ idToken: "ok" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: fx.patient.id,
      name: "Andi Pasien",
      email: "pasien@test.com",
      role: "patient",
    });
  });

  test("membuat akun pasien baru dari Google", async () => {
    verifyGoogleIdToken.mockResolvedValueOnce({
      email: "google@test.com",
      name: "Google User",
    });
    const res = await request(app).post("/api/auth/google").send({ idToken: "ok" });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "google@test.com",
      name: "Google User",
      role: "patient",
    });
    const created = await User.findOne({ where: { email: "google@test.com" } });
    expect(created).not.toBeNull();
  });

  test("dokter tetap masuk sebagai dokter", async () => {
    verifyGoogleIdToken.mockResolvedValueOnce({
      email: "dokter@test.com",
      name: "dr. Sari Gigi",
    });
    const res = await request(app).post("/api/auth/google").send({ idToken: "ok" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("doctor");
    expect(res.body.user.id).toBe(fx.doctorUser.id);
  });
});
