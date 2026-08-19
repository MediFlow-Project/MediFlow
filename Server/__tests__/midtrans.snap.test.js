jest.mock("midtrans-client", () => {
  const createTransaction = jest.fn().mockResolvedValue({ token: "snap-token" });
  return {
    Snap: jest.fn().mockImplementation(() => ({ createTransaction })),
    __createTransaction: createTransaction,
  };
});

const midtransClient = require("midtrans-client");
const { createSnapToken, getSnapClient } = require("../helpers/midtrans");

describe("createSnapToken", () => {
  it("calls Snap sandbox", async () => {
    const result = await createSnapToken({ id: 4, amount: 25000, status: "unpaid" });
    expect(result.snapToken).toBe("snap-token");
    expect(result.orderId).toMatch(/^MEDIFLOW-4-/);
    expect(midtransClient.Snap).toHaveBeenCalled();
    expect(getSnapClient()).toBeDefined();
  });

  it("throws without payment keys", async () => {
    const prevS = process.env.MIDTRANS_SERVER_KEY;
    const prevC = process.env.MIDTRANS_CLIENT_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_CLIENT_KEY;
    jest.resetModules();
    jest.mock("midtrans-client", () => ({
      Snap: jest.fn(),
    }));
    const { createSnapToken: createAgain } = require("../helpers/midtrans");
    await expect(createAgain({ id: 1, amount: 1, status: "unpaid" })).rejects.toMatchObject({
      status: 500,
    });
    process.env.MIDTRANS_SERVER_KEY = prevS;
    process.env.MIDTRANS_CLIENT_KEY = prevC;
  });
});
