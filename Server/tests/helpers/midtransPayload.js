const crypto = require("crypto");

function signedNotification(overrides = {}) {
  const payload = {
    order_id: "MEDIFLOW-1",
    status_code: "200",
    gross_amount: "158000.00",
    transaction_status: "settlement",
    fraud_status: "accept",
    ...overrides,
  };
  payload.signature_key = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
    )
    .digest("hex");
  return payload;
}

module.exports = { signedNotification };
