const crypto = require("crypto");

jest.mock("../helpers/gemini", () => {
  const actual = jest.requireActual("../helpers/gemini");
  return {
    ...actual,
    recommendWithGemini: jest.fn(),
  };
});
jest.mock("../helpers/groq", () => ({
  recommendWithGroq: jest.fn(),
}));

const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const HttpError = require("../helpers/HttpError");
const { signToken, verifyToken } = require("../helpers/jwt");
const { maskPatientName } = require("../helpers/maskName");
const {
  formatDate,
  toDateOnly,
  addDays,
  todayDateOnly,
  dayOfWeekFromDate,
  isPastDate,
  isValidDateOnly,
} = require("../helpers/date");
const {
  orderIdFor,
  canReuseSnap,
  verifySignature,
  amountsMatch,
  mapNotificationStatus,
} = require("../helpers/midtrans");
const { INVOICE_STATUS, ROLES } = require("../helpers/constants");
const { serializeVisit, serializeInvoiceDetail, serializePrescriptionItems } = require("../helpers/visitDetails");
const { optionalImgUrl } = require("../helpers/optionalImgUrl");
const { isChatWritable, chatWriteError } = require("../helpers/chatAccess");
const { recommendWithFallback } = require("../helpers/chatbotLlm");
const { recommendWithGemini, parseModelJson, buildPrompt } = require("../helpers/gemini");
const { recommendWithGroq } = require("../helpers/groq");

describe("bcrypt", () => {
  it("hashes and compares", () => {
    const hash = hashPassword("password123");
    expect(hash).not.toBe("password123");
    expect(comparePassword("password123", hash)).toBe(true);
    expect(comparePassword("wrong", hash)).toBe(false);
  });
});

describe("HttpError", () => {
  it("stores status", () => {
    const err = new HttpError(409, "bentrok");
    expect(err.name).toBe("HttpError");
    expect(err.status).toBe(409);
    expect(err.message).toBe("bentrok");
  });
});

describe("jwt", () => {
  it("signs and verifies with expiry", () => {
    const token = signToken({ userId: 7, role: ROLES.PATIENT });
    const payload = verifyToken(token);
    expect(payload.userId).toBe(7);
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("throws in production without SECRET_KEY on live module", () => {
    const prevNode = process.env.NODE_ENV;
    const prevSecret = process.env.SECRET_KEY;
    process.env.NODE_ENV = "production";
    delete process.env.SECRET_KEY;
    expect(() => signToken({ userId: 1 })).toThrow("SECRET_KEY wajib diisi");
    process.env.NODE_ENV = prevNode;
    process.env.SECRET_KEY = prevSecret;
  });
});

describe("maskName", () => {
  it("masks last name", () => {
    expect(maskPatientName("Andi Saputra")).toBe("Andi S.");
    expect(maskPatientName("Budi")).toBe("Budi");
    expect(maskPatientName("")).toBe("Pasien");
    expect(maskPatientName("   ")).toBe("Pasien");
  });
});

describe("date", () => {
  it("formats and validates", () => {
    expect(formatDate(new Date(2026, 7, 20))).toBe("2026-08-20");
    expect(toDateOnly("2026-08-20T10:00:00.000Z")).toBe("2026-08-20");
    expect(toDateOnly(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateOnly(null)).toBeNull();
    expect(addDays("2026-08-20", 1)).toBe("2026-08-21");
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(todayDateOnly()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dayOfWeekFromDate("2026-08-19")).toBe(3);
    expect(isValidDateOnly("2026-08-20")).toBe(true);
    expect(isValidDateOnly("20-08-2026")).toBe(false);
    expect(isPastDate("2000-01-01")).toBe(true);
    expect(isPastDate("2099-01-01")).toBe(false);
  });
});

describe("midtrans helpers", () => {
  const invoice = {
    id: 9,
    amount: 150000,
    status: INVOICE_STATUS.UNPAID,
    snapToken: null,
    midtransOrderId: null,
  };

  it("creates unique order ids for retry", () => {
    const a = orderIdFor(invoice);
    expect(a).toMatch(/^MEDIFLOW-9-\d+$/);
    expect(canReuseSnap(invoice)).toBe(false);
    expect(
      canReuseSnap({
        status: INVOICE_STATUS.PENDING,
        snapToken: "tok",
        midtransOrderId: "MEDIFLOW-9-1",
      })
    ).toBe(true);
    expect(orderIdFor({
      id: 9,
      status: INVOICE_STATUS.PENDING,
      snapToken: "tok",
      midtransOrderId: "MEDIFLOW-9-1",
    })).toBe("MEDIFLOW-9-1");
  });

  it("verifies signature and amount", () => {
    const payload = {
      order_id: "MEDIFLOW-9-1",
      status_code: "200",
      gross_amount: "150000.00",
    };
    payload.signature_key = crypto
      .createHash("sha512")
      .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest("hex");
    expect(verifySignature(payload)).toBe(true);
    expect(verifySignature({ ...payload, signature_key: "x" })).toBe(false);
    expect(verifySignature({})).toBe(false);
    expect(amountsMatch({ amount: 150000 }, { gross_amount: "150000" })).toBe(true);
    expect(amountsMatch({ amount: 150000 }, { gross_amount: "1" })).toBe(false);
  });

  it("maps notification statuses", () => {
    expect(mapNotificationStatus({ transaction_status: "settlement" })).toBe("paid");
    expect(mapNotificationStatus({ transaction_status: "capture", fraud_status: "accept" })).toBe("paid");
    expect(mapNotificationStatus({ transaction_status: "capture" })).toBe("paid");
    expect(mapNotificationStatus({ transaction_status: "capture", fraud_status: "challenge" })).toBe("pending");
    expect(mapNotificationStatus({ transaction_status: "capture", fraud_status: "deny" })).toBe("failed");
    expect(mapNotificationStatus({ transaction_status: "expire" })).toBe("expire");
    expect(mapNotificationStatus({ transaction_status: "pending" })).toBe("pending");
    expect(mapNotificationStatus({ transaction_status: "deny" })).toBe("failed");
    expect(mapNotificationStatus({ transaction_status: "unknown" })).toBeNull();
  });

  it("returns false signature without server key", () => {
    const prev = process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(verifySignature({ order_id: "a", status_code: "200", gross_amount: "1", signature_key: "x" })).toBe(false);
    process.env.MIDTRANS_SERVER_KEY = prev;
  });
});

describe("visitDetails", () => {
  it("serializes consultation items and invoice", () => {
    const appointment = {
      Doctor: { consultationFee: 100000, User: { name: "dr. A" }, Specialty: { name: "Gigi" }, id: 2 },
      Consultation: {
        id: 1,
        complaint: "sakit",
        diagnosis: "karies",
        notes: "ok",
        PrescriptionItems: [
          { id: 8, medicineId: 3, quantity: 2, dosage: "3x1", Medicine: { name: "Paracetamol", price: 5000, imgUrl: "http://x.test/para.png" } },
        ],
      },
      Invoice: { id: 4, amount: 110000, status: "unpaid" },
      date: "2026-08-20",
      session: "morning",
      Patient: { id: 9, name: "Budi" },
    };
    const visit = serializeVisit(appointment);
    expect(visit.invoice.medicineTotal).toBe(10000);
    expect(visit.consultation.items[0].subtotal).toBe(10000);
    expect(visit.consultation.items[0].imgUrl).toBe("http://x.test/para.png");
    const detail = serializeInvoiceDetail(appointment.Invoice, appointment);
    expect(detail.items).toHaveLength(1);
    expect(detail.doctor.name).toBe("dr. A");
    expect(serializePrescriptionItems(null)).toEqual([]);
    expect(serializeVisit({}).invoice).toBeNull();
    expect(serializeInvoiceDetail({ id: 1, appointmentId: 2, amount: 0, status: "unpaid" }, null).consultation).toBeNull();
  });
});

describe("optionalImgUrl", () => {
  it("normalizes empty and present values", () => {
    expect(optionalImgUrl(undefined)).toBeUndefined();
    expect(optionalImgUrl(null)).toBeNull();
    expect(optionalImgUrl("")).toBeNull();
    expect(optionalImgUrl("  ")).toBeNull();
    expect(optionalImgUrl(" http://x.test/a.png ")).toBe("http://x.test/a.png");
  });
});

describe("chatAccess", () => {
  it("stays writable after complete with no expiry", () => {
    expect(isChatWritable(null)).toBe(false);
    expect(isChatWritable({ status: "in_consultation", date: "2026-08-20" })).toBe(false);
    expect(isChatWritable({ status: "completed", date: "2026-08-20" })).toBe(true);
    expect(isChatWritable({ status: "completed", date: "2000-01-01" })).toBe(true);
    expect(isChatWritable({ status: "cancelled" })).toBe(false);
    expect(isChatWritable({ status: "no_show" })).toBe(false);
    expect(chatWriteError({ status: "booked", date: "2026-08-20" })).toMatch(/setelah konsultasi/);
    expect(chatWriteError({ status: "cancelled" })).toMatch(/tidak tersedia/);
    expect(chatWriteError({ status: "no_show" })).toMatch(/tidak tersedia/);
    expect(chatWriteError({ status: "completed", date: "2000-01-01" })).toBeNull();
  });
});

describe("gemini parse", () => {
  it("parses json and fenced json", () => {
    expect(parseModelJson('{"reply":"ok"}').reply).toBe("ok");
    expect(parseModelJson('```json\n{"reply":"hi"}\n```').reply).toBe("hi");
    expect(parseModelJson("prefix {\"reply\":\"x\"} tail").reply).toBe("x");
    expect(parseModelJson("")).toBeNull();
    expect(parseModelJson("not json")).toBeNull();
    expect(parseModelJson("{nope")).toBeNull();
    expect(buildPrompt("sakit gigi", [{ doctorId: 1 }])).toContain("sakit gigi");
  });
});

describe("chatbot fallback", () => {
  it("uses gemini first", async () => {
    recommendWithGemini.mockResolvedValue({ reply: "ok", recommendations: [] });
    const result = await recommendWithFallback("hi", []);
    expect(result.reply).toBe("ok");
  });

  it("falls back to groq", async () => {
    recommendWithGemini.mockRejectedValue(new Error("down"));
    recommendWithGroq.mockResolvedValue({ reply: "groq", recommendations: [] });
    const result = await recommendWithFallback("hi", []);
    expect(result.reply).toBe("groq");
  });

  it("throws when both keys are missing", async () => {
    recommendWithGemini.mockRejectedValue(new Error("Konfigurasi Gemini belum tersedia"));
    recommendWithGroq.mockRejectedValue(new Error("Konfigurasi Groq belum tersedia"));
    const prev = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    await expect(recommendWithFallback("hi", [])).rejects.toMatchObject({
      status: 500,
      message: "Konfigurasi chatbot belum tersedia",
    });
    process.env.GROQ_API_KEY = prev;
  });

  it("throws a generic error when both models fail", async () => {
    process.env.GROQ_API_KEY = "x";
    recommendWithGemini.mockRejectedValue(new Error("timeout"));
    recommendWithGroq.mockRejectedValue(new Error("timeout"));
    await expect(recommendWithFallback("hi", [])).rejects.toMatchObject({
      status: 500,
      message: "Asisten AI sedang tidak tersedia",
    });
  });
});
