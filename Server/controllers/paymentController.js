const { Invoice, Appointment } = require("../models");
const {
  verifySignature,
  mapNotificationStatus,
  amountsMatch,
} = require("../helpers/midtrans");
const HttpError = require("../helpers/HttpError");
const { INVOICE_STATUS } = require("../helpers/constants");
const { notifyInvoiceStatusChange } = require("../helpers/notify");

class PaymentController {
  static async notification(req, res, next) {
    try {
      if (!verifySignature(req.body)) {
        throw new HttpError(403, "Signature Midtrans tidak valid");
      }

      const invoice = await Invoice.findOne({
        where: { midtransOrderId: req.body.order_id },
        include: [{ model: Appointment }],
      });

      if (!invoice || invoice.status === INVOICE_STATUS.PAID) {
        return res.status(200).json({ received: true });
      }

      if (!amountsMatch(invoice, req.body)) {
        return res.status(200).json({ received: true, ignored: "amount_mismatch" });
      }

      const nextStatus = mapNotificationStatus(req.body);
      if (nextStatus && nextStatus !== invoice.status) {
        await invoice.update({ status: nextStatus });
        await notifyInvoiceStatusChange(invoice, invoice.Appointment);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PaymentController;
