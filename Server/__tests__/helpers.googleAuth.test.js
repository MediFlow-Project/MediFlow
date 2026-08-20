jest.mock("google-auth-library", () => {
  const verifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
    __mocks: { verifyIdToken },
  };
});

const { __mocks } = require("google-auth-library");
const { verifyGoogleIdToken } = require("../helpers/googleAuth");

describe("verifyGoogleIdToken", () => {
  const prevClientId = process.env.GOOGLE_CLIENT_ID;

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = prevClientId;
  });

  it("rejects missing configuration and token", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    await expect(verifyGoogleIdToken("token")).rejects.toMatchObject({ status: 500 });

    process.env.GOOGLE_CLIENT_ID = prevClientId;
    await expect(verifyGoogleIdToken("")).rejects.toMatchObject({ status: 400 });
    await expect(verifyGoogleIdToken("   ")).rejects.toMatchObject({ status: 400 });
  });

  it("rejects invalid or unverified Google accounts", async () => {
    __mocks.verifyIdToken.mockRejectedValueOnce(new Error("bad jwt"));
    await expect(verifyGoogleIdToken("bad")).rejects.toMatchObject({ status: 401 });

    __mocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: "a@test.com", email_verified: false, name: "A" }),
    });
    await expect(verifyGoogleIdToken("token")).rejects.toMatchObject({ status: 401 });

    __mocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({}),
    });
    await expect(verifyGoogleIdToken("token")).rejects.toMatchObject({ status: 401 });
  });

  it("returns normalized profile from a valid token", async () => {
    __mocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: "  A@Test.COM ",
        email_verified: true,
        name: "Budi",
      }),
    });

    await expect(verifyGoogleIdToken("  valid-token  ")).resolves.toEqual({
      email: "a@test.com",
      name: "Budi",
    });
    expect(__mocks.verifyIdToken).toHaveBeenCalledWith({
      idToken: "valid-token",
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    __mocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: "salsa@test.com",
        email_verified: true,
        given_name: "Salsa",
        family_name: "Putri",
      }),
    });
    await expect(verifyGoogleIdToken("token")).resolves.toMatchObject({ name: "Salsa Putri" });

    __mocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: "anon@test.com", email_verified: true }),
    });
    await expect(verifyGoogleIdToken("token")).resolves.toMatchObject({ name: "anon" });

    __mocks.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: "@test.com", email_verified: true }),
    });
    await expect(verifyGoogleIdToken("token")).resolves.toMatchObject({ name: "Pasien" });
  });
});
