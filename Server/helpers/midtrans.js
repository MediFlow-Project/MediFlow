require("dotenv").config();
const crypto = require("crypto");
const midtransClient = require("midtrans-client");
const HttpError = require("./HttpError");

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

function orderIdFor(invoice) {
  return invoice.midtransOrderId || `MEDIFLOW-${invoice.id}`;
}

async function createSnapToken(invoice) {
  const snap = getSnapClient();
  const orderId = orderIdFor(invoice);
  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: invoice.amount,
    },
  });

  return {
    orderId,
    snapToken: transaction.token,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  };
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

function mapNotificationStatus(notification) {
  const transactionStatus = notification.transaction_status;
  const fraudStatus = notification.fraud_status;

  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") return "pending";
    if (fraudStatus === "accept" || !fraudStatus) return "paid";
    return "failed";
  }
  if (transactionStatus === "settlement") return "paid";
  if (transactionStatus === "expire") return "expire";
  if (transactionStatus === "pending") return "pending";
  if (["cancel", "deny", "failure"].includes(transactionStatus)) return "failed";
  return null;
}

module.exports = {
  createSnapToken,
  verifySignature,
  mapNotificationStatus,
};
