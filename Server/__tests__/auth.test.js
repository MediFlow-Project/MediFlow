const request = require("supertest");
const { app } = require("../tests/loadApp");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { auth } = require("../tests/helpers/http");

describe("Auth (Raihan)", () => {
  let fx;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
  });

  test("register menolak payload tidak lengkap", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Citra",
      email: "citra@test.com",
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Nama, email, password, dan nomor HP wajib diisi",
    });
  });

  test("register menolak password pendek", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Citra",
      email: "citra@test.com",
      password: "123",
      phone: "081666666666",
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Password minimal 6 karakter" });
  });

  test("register membuat akun pasien", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Citra Baru",
      email: "citra@test.com",
      password: "password123",
      phone: "081666666666",
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Citra Baru",
      email: "citra@test.com",
      phone: "081666666666",
      role: "patient",
    });
    expect(res.body.passwordHash).toBeUndefined();
  });

  test("register email duplikat mengembalikan 409", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Andi Lain",
      email: "pasien@test.com",
      password: "password123",
      phone: "081777777777",
    });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Email sudah terdaftar" });
  });

  test("login menolak email/password kosong", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "pasien@test.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Email dan password wajib diisi" });
  });

  test("login menolak kredensial salah", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pasien@test.com",
      password: "salahsekali",
    });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Email atau password salah" });
  });

  test("login mengembalikan accessToken", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pasien@test.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: fx.patient.id,
      name: "Andi Pasien",
      email: "pasien@test.com",
      role: "patient",
    });
  });

  test("GET /api/me tanpa token mengembalikan 401", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/me pasien tidak menyertakan profil dokter", async () => {
    const res = await request(app).get("/api/me").set(auth(fx.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: fx.patient.id,
      email: "pasien@test.com",
      role: "patient",
    });
    expect(res.body.doctor).toBeUndefined();
  });

  test("GET /api/me dokter menyertakan profil dokter", async () => {
    const res = await request(app).get("/api/me").set(auth(fx.tokens.doctor));
    expect(res.status).toBe(200);
    expect(res.body.doctor).toMatchObject({
      id: fx.doctor.id,
      specialtyId: fx.specialty.id,
      consultationFee: 150000,
    });
  });
});
