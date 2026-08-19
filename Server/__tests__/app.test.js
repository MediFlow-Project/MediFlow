jest.mock("../models", () => require("./utils").createModelsMock());

const request = require("supertest");
const app = require("../app");

describe("app", () => {
  it("returns 404 json", async () => {
    const res = await request(app).get("/api/tidak-ada");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Endpoint tidak ditemukan");
  });

  it("rejects unauthenticated protected routes", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });
});
