require("dotenv").config();
const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const HttpError = require("./HttpError");
const { INVOICE_STATUS } = require("./constants");

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
  if (canReuseSnap(invoice)) return invoice.midtransOrderId;
  return `MEDIFLOW-${invoice.id}-${Date.now()}`;
}

async function createSnapToken(invoice) {
  const snap = getSnapClient();
  const orderId = orderIdFor(invoice);
  const finish = finishRedirectUrl(invoice);
  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: invoice.amount,
    },
    callbacks: {
      finish,
    },
  });

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
  createSnapToken,
  finishRedirectUrl,
  fetchTransactionStatus,
  syncInvoiceFromMidtrans,
  verifySignature,
  amountsMatch,
  mapNotificationStatus,
};
