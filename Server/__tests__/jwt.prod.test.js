process.env.NODE_ENV = "production";
delete process.env.SECRET_KEY;

describe("jwt production secret", () => {
  it("throws without SECRET_KEY", () => {
    jest.resetModules();
    const { signToken } = require("../helpers/jwt");
    expect(() => signToken({ userId: 1 })).toThrow("SECRET_KEY wajib diisi");
  });
});
