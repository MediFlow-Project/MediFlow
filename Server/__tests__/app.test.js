jest.mock("../models", () => require("./utils").createModelsMock());

const request = require("supertest");
const app = require("../app");

describe("app", () => {
  it("returns health ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns 404 json", async () => {
    const res = await request(app).get("/api/tidak-ada");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Endpoint tidak ditemukan");
  });

  it("rejects google login without id token", async () => {
    const res = await request(app).post("/api/auth/google").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Token Google wajib diisi");
  });

  it("rejects unauthenticated protected routes", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("patient invoice list route exists", async () => {
    const res = await request(app).get("/api/invoices");
    expect(res.status).toBe(401);
    expect(res.body.error).not.toBe("Endpoint tidak ditemukan");
  });

  it("admin doctor update route exists", async () => {
    const res = await request(app).put("/api/admin/doctors/1").send({ name: "A" });
    expect(res.status).toBe(401);
    expect(res.body.error).not.toBe("Endpoint tidak ditemukan");
  });

  it("admin upload route exists", async () => {
    const res = await request(app).post("/api/admin/uploads");
    expect(res.status).toBe(401);
    expect(res.body.error).not.toBe("Endpoint tidak ditemukan");
  });

  it("admin doctor update accepts multipart", async () => {
    const res = await request(app)
      .put("/api/admin/doctors/1")
      .attach("file", Buffer.from("fake-image"), "dokter.jpg");
    expect(res.status).toBe(401);
    expect(res.body.error).not.toBe("Endpoint tidak ditemukan");
  });
});
