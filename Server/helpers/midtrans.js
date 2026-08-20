require("dotenv").config();
const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const HttpError = require("./HttpError");
const { INVOICE_STATUS } = require("./constants");
const { serializePrescriptionItems } = require("./visitDetails");

const ITEM_NAME_MAX = 50;

function getSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) {
    throw new HttpError(500, "Konfigurasi pembayaran belum tersedia");
  }

  return new midtransClient.Snap({
    isProduction: false,
    serverKey,
    clientKey,
  });
}

function getCoreApi() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) {
    throw new HttpError(500, "Konfigurasi pembayaran belum tersedia");
  }

  return new midtransClient.CoreApi({
    isProduction: false,
    serverKey,
    clientKey,
  });
}

function finishRedirectUrl(invoice) {
  const base = String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/tagihan/${invoice.id}`;
}

function canReuseSnap(invoice) {
  return (
    invoice.status === INVOICE_STATUS.PENDING &&
    Boolean(invoice.snapToken) &&
    Boolean(invoice.midtransOrderId)
  );
}

function orderIdFor(invoice) {
  return `MEDIFLOW-${invoice.id}-${Date.now()}`;
}

function clipText(value, fallback, max = ITEM_NAME_MAX) {
  const text = String(value || "")
    .replace(/[^\w\s.&+\-/'()]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return text || fallback;
}

function snapGrossAmount(invoice) {
  const amount = Math.round(Number(invoice.amount));
  if (!Number.isFinite(amount) || amount < 1) {
    throw new HttpError(400, "Nominal tagihan tidak valid");
  }
  return amount;
}

function snapItemDetails(invoice, amount) {
  const appointment = invoice.Appointment;
  const consultationFee = Math.round(Number(appointment?.Doctor?.consultationFee ?? 0));
  const medicines = serializePrescriptionItems(appointment?.Consultation);
  const details = [];

  if (consultationFee > 0) {
    details.push({
      id: `consult-${invoice.id}`,
      name: clipText(`Konsultasi ${appointment?.Doctor?.Specialty?.name || "dokter"}`, "Konsultasi"),
      price: consultationFee,
      quantity: 1,
    });
  }

  for (const item of medicines) {
    const price = Math.round(Number(item.price));
    const quantity = Math.round(Number(item.quantity));
    if (price > 0 && quantity > 0) {
      details.push({
        id: `med-${item.medicineId || item.id}`,
        name: clipText(item.name, "Obat"),
        price,
        quantity,
      });
    }
  }

  const sum = details.reduce((total, item) => total + item.price * item.quantity, 0);
  if (!details.length || sum !== amount) {
    return [
      {
        id: `inv-${invoice.id}`,
        name: "Tagihan kunjungan MediFlow",
        price: amount,
        quantity: 1,
      },
    ];
  }
  return details;
}

function snapPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 19) return undefined;
  return digits;
}

function snapCustomerDetails(invoice) {
  const patient = invoice.Appointment?.Patient;
  if (!patient) return undefined;

  const fullName = clipText(patient.name, "Pasien", 50);
  const [first, ...rest] = fullName.split(" ");
  const customer = { first_name: first || "Pasien" };
  const lastName = rest.join(" ").slice(0, 50);
  if (lastName) customer.last_name = lastName;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(patient.email || ""))) {
    customer.email = String(patient.email).trim();
  }
  const phone = snapPhone(patient.phone);
  if (phone) customer.phone = phone;
  return customer;
}

function buildSnapPayload(invoice) {
  const orderId = orderIdFor(invoice);
  const amount = snapGrossAmount(invoice);
  const finish = finishRedirectUrl(invoice);
  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: snapItemDetails(invoice, amount),
    callbacks: { finish },
    credit_card: { secure: true },
    gopay: {
      enable_callback: true,
      callback_url: finish,
    },
  };
  const customer = snapCustomerDetails(invoice);
  if (customer) payload.customer_details = customer;
  return { orderId, payload };
}

async function cancelSnapOrder(orderId) {
  if (!orderId) return;
  try {
    const core = getCoreApi();
    await core.transaction.cancel(orderId);
  } catch {
    // Pesanan lama mungkin sudah expire/cancel — lanjut buat token baru.
  }
}

async function createSnapToken(invoice) {
  if (invoice.midtransOrderId) {
    await cancelSnapOrder(invoice.midtransOrderId);
  }

  const snap = getSnapClient();
  const { orderId, payload } = buildSnapPayload(invoice);
  const transaction = await snap.createTransaction(payload);

  return {
    orderId,
    snapToken: transaction.token,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  };
}

async function fetchTransactionStatus(orderId) {
  const core = getCoreApi();
  return core.transaction.status(orderId);
}

async function syncInvoiceFromMidtrans(invoice) {
  if (!invoice?.midtransOrderId || invoice.status === INVOICE_STATUS.PAID) {
    return invoice;
  }

  const remote = await fetchTransactionStatus(invoice.midtransOrderId);
  if (!amountsMatch(invoice, remote)) return invoice;

  const nextStatus = mapNotificationStatus(remote);
  if (nextStatus && nextStatus !== invoice.status) {
    await invoice.update({ status: nextStatus });
  }
  return invoice;
}

function verifySignature(payload) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const orderId = payload.order_id;
  const statusCode = payload.status_code;
  const grossAmount = payload.gross_amount;
  const signatureKey = payload.signature_key;
  if (!orderId || !statusCode || !grossAmount || !signatureKey) return false;

  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  return expected === signatureKey;
}

function amountsMatch(invoice, payload) {
  const expected = Number(invoice.amount);
  const received = Number(payload.gross_amount);
  return Number.isFinite(expected) && Number.isFinite(received) && expected === received;
}

function mapNotificationStatus(notification) {
  const transactionStatus = notification.transaction_status;
  const fraudStatus = notification.fraud_status;

  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") return INVOICE_STATUS.PENDING;
    if (fraudStatus === "accept" || !fraudStatus) return INVOICE_STATUS.PAID;
    return INVOICE_STATUS.FAILED;
  }
  if (transactionStatus === "settlement") return INVOICE_STATUS.PAID;
  if (transactionStatus === "expire") return INVOICE_STATUS.EXPIRE;
  if (transactionStatus === "pending") return INVOICE_STATUS.PENDING;
  if (["cancel", "deny", "failure"].includes(transactionStatus)) return INVOICE_STATUS.FAILED;
  return null;
}

module.exports = {
  getSnapClient,
  canReuseSnap,
  orderIdFor,
  buildSnapPayload,
  cancelSnapOrder,
  createSnapToken,
  finishRedirectUrl,
  fetchTransactionStatus,
  syncInvoiceFromMidtrans,
  verifySignature,
  amountsMatch,
  mapNotificationStatus,
};
