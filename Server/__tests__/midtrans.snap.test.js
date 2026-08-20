jest.mock("midtrans-client", () => {
  const createTransaction = jest.fn().mockResolvedValue({ token: "snap-token" });
  const status = jest.fn().mockResolvedValue({
    transaction_status: "settlement",
    gross_amount: "25000",
  });
  return {
    Snap: jest.fn().mockImplementation(() => ({ createTransaction })),
    CoreApi: jest.fn().mockImplementation(() => ({
      transaction: { status },
    })),
    __createTransaction: createTransaction,
    __status: status,
  };
});

const midtransClient = require("midtrans-client");
const { createSnapToken, getSnapClient, syncInvoiceFromMidtrans } = require("../helpers/midtrans");

describe("createSnapToken", () => {
  it("calls Snap sandbox", async () => {
    const result = await createSnapToken({ id: 4, amount: 25000, status: "unpaid" });
    expect(result.snapToken).toBe("snap-token");
    expect(result.orderId).toMatch(/^MEDIFLOW-4-/);
    expect(midtransClient.Snap).toHaveBeenCalled();
    expect(getSnapClient()).toBeDefined();
    expect(midtransClient.__createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        callbacks: expect.objectContaining({
          finish: "http://localhost:5173/tagihan/4",
        }),
      })
    );
  });

  it("throws without payment keys", async () => {
    const prevS = process.env.MIDTRANS_SERVER_KEY;
    const prevC = process.env.MIDTRANS_CLIENT_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_CLIENT_KEY;
    await expect(createSnapToken({ id: 1, amount: 1, status: "unpaid" })).rejects.toMatchObject({
      status: 500,
    });
    process.env.MIDTRANS_SERVER_KEY = prevS;
    process.env.MIDTRANS_CLIENT_KEY = prevC;
  });
});

describe("syncInvoiceFromMidtrans", () => {
  it("marks a settled invoice as paid", async () => {
    const invoice = {
      amount: 25000,
      status: "pending",
      midtransOrderId: "MEDIFLOW-4-1",
      update: jest.fn(),
    };
    await syncInvoiceFromMidtrans(invoice);
    expect(invoice.update).toHaveBeenCalledWith({ status: "paid" });
  });
});
