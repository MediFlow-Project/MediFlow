const { User, Doctor } = require("../models");
const authentication = require("../middlewares/authentication");
const {
  authorize,
  requireDoctor,
  requireAdmin,
  requirePatient,
} = require("../middlewares/authorization");
const errorHandler = require("../middlewares/errorHandler");
const { mockRes, mockNext } = require("./utils");
const { signToken } = require("../helpers/jwt");
const HttpError = require("../helpers/HttpError");

jest.mock("../models", () => ({
  User: { findByPk: jest.fn() },
  Doctor: { findOne: jest.fn() },
}));

describe("authentication", () => {
  it("rejects missing header", async () => {
    const next = mockNext();
    await authentication({ headers: {} }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("rejects empty bearer", async () => {
    const next = mockNext();
    await authentication({ headers: { authorization: "Bearer " } }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("rejects unknown user", async () => {
    const token = signToken({ userId: 99, role: "patient" });
    User.findByPk.mockResolvedValue(null);
    const next = mockNext();
    await authentication({ headers: { authorization: `Bearer ${token}` } }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("sets req.user", async () => {
    const token = signToken({ userId: 1, role: "patient" });
    User.findByPk.mockResolvedValue({ id: 1, name: "A", email: "a@test.com", role: "patient" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = mockNext();
    await authentication(req, mockRes(), next);
    expect(req.user.id).toBe(1);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("authorization", () => {
  it("authorize allows matching role", () => {
    const next = mockNext();
    authorize("admin")({ user: { role: "admin" } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("authorize rejects other roles", () => {
    const next = mockNext();
    authorize("admin")({ user: { role: "patient" } }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });

  it("requirePatient and requireAdmin", () => {
    const next = mockNext();
    requirePatient({ user: { role: "patient" } }, mockRes(), next);
    requireAdmin({ user: { role: "admin" } }, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it("requireDoctor loads profile", async () => {
    Doctor.findOne.mockResolvedValue({ id: 3, userId: 2 });
    const req = { user: { id: 2, role: "doctor" } };
    const next = mockNext();
    await requireDoctor(req, mockRes(), next);
    expect(req.doctor.id).toBe(3);
    expect(next).toHaveBeenCalledWith();
  });

  it("requireDoctor rejects patient", async () => {
    const next = mockNext();
    await requireDoctor({ user: { role: "patient" } }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });

  it("requireDoctor rejects missing profile", async () => {
    Doctor.findOne.mockResolvedValue(null);
    const next = mockNext();
    await requireDoctor({ user: { id: 2, role: "doctor" } }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});

describe("errorHandler", () => {
  const res = () => mockRes();

  it("handles HttpError", () => {
    const r = res();
    errorHandler(new HttpError(400, "salah"), {}, r, jest.fn());
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith({ error: "salah" });
  });

  it("handles jwt errors", () => {
    const r = res();
    errorHandler({ name: "JsonWebTokenError" }, {}, r, jest.fn());
    expect(r.status).toHaveBeenCalledWith(401);
    const r2 = res();
    errorHandler({ name: "TokenExpiredError" }, {}, r2, jest.fn());
    expect(r2.status).toHaveBeenCalledWith(401);
  });

  it("handles sequelize validation and unique", () => {
    const r = res();
    errorHandler({ name: "SequelizeValidationError", errors: [{ message: "wajib" }] }, {}, r, jest.fn());
    expect(r.status).toHaveBeenCalledWith(400);
    const r2 = res();
    errorHandler({ name: "SequelizeUniqueConstraintError", errors: [{ path: "email" }] }, {}, r2, jest.fn());
    expect(r2.status).toHaveBeenCalledWith(409);
    const r3 = res();
    errorHandler({ name: "SequelizeUniqueConstraintError", index: "appointments_active_unique" }, {}, r3, jest.fn());
    expect(r3.status).toHaveBeenCalledWith(409);
    const r4 = res();
    errorHandler({ name: "SequelizeUniqueConstraintError", errors: [] }, {}, r4, jest.fn());
    expect(r4.json).toHaveBeenCalledWith({ error: "Data bentrok dengan data yang sudah ada" });
  });

  it("handles fk and generic", () => {
    const r = res();
    errorHandler({ name: "SequelizeForeignKeyConstraintError" }, {}, r, jest.fn());
    expect(r.status).toHaveBeenCalledWith(400);
    const r2 = res();
    errorHandler({ name: "Error", message: "boom" }, {}, r2, jest.fn());
    expect(r2.status).toHaveBeenCalledWith(500);
  });
});
