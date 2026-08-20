jest.mock("midtrans-client", () => {
  const createTransaction = jest.fn();
  function Snap() {
    return { createTransaction };
  }
  Snap._createTransaction = createTransaction;
  return { Snap };
});

const midtransClient = require("midtrans-client");
const { createSnapToken } = require("../helpers/midtrans");

describe("helpers/midtrans createSnapToken", () => {
  const originalServer = process.env.MIDTRANS_SERVER_KEY;
  const originalClient = process.env.MIDTRANS_CLIENT_KEY;

  afterEach(() => {
    process.env.MIDTRANS_SERVER_KEY = originalServer;
    process.env.MIDTRANS_CLIENT_KEY = originalClient;
    midtransClient.Snap._createTransaction.mockReset();
  });

  test("menolak jika konfigurasi kosong", async () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    await expect(createSnapToken({ id: 1, amount: 1000 })).rejects.toMatchObject({
      status: 500,
      message: "Konfigurasi pembayaran belum tersedia",
    });
  });

  test("membuat snap token baru dan memakai orderId yang sudah ada", async () => {
    midtransClient.Snap._createTransaction.mockResolvedValue({ token: "snap-abc" });
    const created = await createSnapToken({ id: 7, amount: 150000 });
    expect(created).toEqual({
      orderId: "MEDIFLOW-7",
      snapToken: "snap-abc",
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const reused = await createSnapToken({
      id: 7,
      amount: 150000,
      midtransOrderId: "ORDER-EXISTING",
    });
    expect(reused.orderId).toBe("ORDER-EXISTING");
  });
});
