const { Invoice } = require("../models");
const { verifySignature, mapNotificationStatus } = require("../helpers/midtrans");

async function notification(req, res) {
  try {
    if (!verifySignature(req.body)) {
      return res.status(403).json({ error: "Signature Midtrans tidak valid" });
    }

    const invoice = await Invoice.findOne({
      where: { midtransOrderId: req.body.order_id },
    });

    if (!invoice) {
      return res.status(200).json({ received: true });
    }

    if (invoice.status === "paid") {
      return res.status(200).json({ received: true });
    }

    const nextStatus = mapNotificationStatus(req.body);
    if (!nextStatus) {
      return res.status(200).json({ received: true });
    }

    await invoice.update({ status: nextStatus });
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
}

module.exports = { notification };
