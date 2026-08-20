jest.mock("midtrans-client", () => {
  const createTransaction = jest.fn().mockResolvedValue({ token: "snap-token" });
  const status = jest.fn().mockResolvedValue({
    transaction_status: "settlement",
    gross_amount: "25000",
  });
  const cancel = jest.fn().mockResolvedValue({});
  return {
    Snap: jest.fn().mockImplementation(() => ({ createTransaction })),
    CoreApi: jest.fn().mockImplementation(() => ({
      transaction: { status, cancel },
    })),
    __createTransaction: createTransaction,
    __status: status,
    __cancel: cancel,
  };
});

const midtransClient = require("midtrans-client");
const { createSnapToken, getSnapClient, syncInvoiceFromMidtrans } = require("../helpers/midtrans");

describe("createSnapToken", () => {
  it("calls Snap sandbox with integer amount and item details", async () => {
    const result = await createSnapToken({ id: 4, amount: "25000.00", status: "unpaid" });
    expect(result.snapToken).toBe("snap-token");
    expect(result.orderId).toMatch(/^MEDIFLOW-4-/);
    expect(midtransClient.Snap).toHaveBeenCalled();
    expect(getSnapClient()).toBeDefined();
    expect(midtransClient.__createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction_details: expect.objectContaining({
          order_id: expect.stringMatching(/^MEDIFLOW-4-/),
          gross_amount: 25000,
        }),
        item_details: [
          expect.objectContaining({
            price: 25000,
            quantity: 1,
          }),
        ],
        callbacks: expect.objectContaining({
          finish: "http://localhost:5173/tagihan/4",
        }),
        gopay: expect.objectContaining({
          enable_callback: true,
        }),
      })
    );
  });

  it("sends matching line items and customer details from the visit", async () => {
    await createSnapToken({
      id: 8,
      amount: 160000,
      status: "unpaid",
      Appointment: {
        Doctor: { consultationFee: 150000, Specialty: { name: "Gigi" } },
        Consultation: {
          PrescriptionItems: [
            { id: 1, medicineId: 3, quantity: 2, Medicine: { name: "Paracetamol", price: 5000 } },
          ],
        },
        Patient: {
          name: "Budi Santoso",
          email: "budi@example.com",
          phone: "+62 812-3456-7890",
        },
      },
    });
    expect(midtransClient.__createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction_details: expect.objectContaining({ gross_amount: 160000 }),
        item_details: [
          expect.objectContaining({ name: "Konsultasi Gigi", price: 150000, quantity: 1 }),
          expect.objectContaining({ name: "Paracetamol", price: 5000, quantity: 2 }),
        ],
        customer_details: expect.objectContaining({
          first_name: "Budi",
          last_name: "Santoso",
          email: "budi@example.com",
          phone: "6281234567890",
        }),
      })
    );
  });

  it("cancels a previous Snap order before minting a new token", async () => {
    await createSnapToken({
      id: 4,
      amount: 25000,
      status: "pending",
      midtransOrderId: "MEDIFLOW-4-old",
      snapToken: "old",
    });
    expect(midtransClient.__cancel).toHaveBeenCalledWith("MEDIFLOW-4-old");
  });

  it("still creates a Snap token if cancel of the old order fails", async () => {
    midtransClient.__cancel.mockRejectedValueOnce(new Error("gone"));
    const result = await createSnapToken({
      id: 4,
      amount: 25000,
      midtransOrderId: "MEDIFLOW-4-old",
    });
    expect(result.snapToken).toBe("snap-token");
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
