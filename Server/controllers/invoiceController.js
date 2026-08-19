const {
  Invoice,
  Appointment,
  Doctor,
  User,
  Specialty,
  Consultation,
  PrescriptionItem,
  Medicine,
} = require("../models");
const { createSnapToken, canReuseSnap } = require("../helpers/midtrans");
const HttpError = require("../helpers/HttpError");
const { INVOICE_STATUS, ROLES } = require("../helpers/constants");
const { isValidDateOnly, toDateOnly } = require("../helpers/date");
const { serializeInvoiceDetail } = require("../helpers/visitDetails");

const invoiceAppointmentInclude = [
  {
    model: Appointment,
    include: [
      { model: User, as: "Patient", attributes: ["id", "name", "email"] },
      {
        model: Doctor,
        include: [
          { model: User, attributes: ["id", "name"] },
          { model: Specialty, attributes: ["id", "name"] },
        ],
      },
      {
        model: Consultation,
        include: [
          {
            model: PrescriptionItem,
            include: [{ model: Medicine, attributes: ["id", "name", "price", "imgUrl"] }],
          },
        ],
      },
    ],
  },
];

async function loadInvoice(id) {
  const invoice = await Invoice.findByPk(id, { include: invoiceAppointmentInclude });
  if (!invoice) throw new HttpError(404, "Tagihan tidak ditemukan");
  return invoice;
}

async function assertCanReadInvoice(req, invoice) {
  const appointment = invoice.Appointment;
  if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
  const { role, id: userId } = req.user;

  if (role === ROLES.ADMIN) return appointment;
  if (role === ROLES.PATIENT && appointment.patientId === userId) return appointment;

  if (role === ROLES.DOCTOR) {
    const doctor = appointment.Doctor || (await Doctor.findByPk(appointment.doctorId));
    if (doctor && doctor.userId === userId) return appointment;
  }

  throw new HttpError(403, "Anda tidak memiliki akses");
}

class InvoiceController {
  static async detail(req, res, next) {
    try {
      const invoice = await loadInvoice(req.params.id);
      const appointment = await assertCanReadInvoice(req, invoice);
      res.status(200).json(serializeInvoiceDetail(invoice, appointment));
    } catch (err) {
      next(err);
    }
  }

  static async pay(req, res, next) {
    try {
      const invoice = await loadInvoice(req.params.id);
      const appointment = invoice.Appointment;
      if (!appointment || appointment.patientId !== req.user.id) {
        throw new HttpError(403, "Anda tidak memiliki akses");
      }

      if (invoice.status === INVOICE_STATUS.PAID) {
        throw new HttpError(409, "Tagihan sudah dibayar");
      }

      if (canReuseSnap(invoice)) {
        return res.status(200).json({
          snapToken: invoice.snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });
      }

      const result = await createSnapToken(invoice);
      await invoice.update({
        midtransOrderId: result.orderId,
        snapToken: result.snapToken,
        status: INVOICE_STATUS.PENDING,
      });

      res.status(200).json({
        snapToken: result.snapToken,
        clientKey: result.clientKey,
      });
    } catch (err) {
      next(err);
    }
  }

  static async adminList(req, res, next) {
    try {
      const { status, date } = req.query;
      const where = {};
      const appointmentWhere = {};

      if (status) {
        if (!Object.values(INVOICE_STATUS).includes(status)) {
          throw new HttpError(400, "Status tagihan tidak valid");
        }
        where.status = status;
      }
      if (date) {
        if (!isValidDateOnly(date)) {
          throw new HttpError(400, "Format tanggal harus YYYY-MM-DD");
        }
        appointmentWhere.date = date;
      }

      const invoices = await Invoice.findAll({
        where,
        include: [
          {
            model: Appointment,
            where: Object.keys(appointmentWhere).length ? appointmentWhere : undefined,
            include: [
              { model: User, as: "Patient", attributes: ["id", "name", "email"] },
              {
                model: Doctor,
                include: [
                  { model: User, attributes: ["id", "name"] },
                  { model: Specialty, attributes: ["id", "name"] },
                ],
              },
            ],
          },
        ],
        order: [["id", "DESC"]],
      });

      res.status(200).json(
        invoices.map((invoice) => ({
          id: invoice.id,
          appointmentId: invoice.appointmentId,
          amount: invoice.amount,
          status: invoice.status,
          midtransOrderId: invoice.midtransOrderId,
          date: toDateOnly(invoice.Appointment?.date),
          session: invoice.Appointment?.session,
          patient: invoice.Appointment?.Patient || null,
          doctor: invoice.Appointment?.Doctor
            ? {
                id: invoice.Appointment.Doctor.id,
                name: invoice.Appointment.Doctor.User?.name,
                specialty: invoice.Appointment.Doctor.Specialty,
              }
            : null,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InvoiceController;
