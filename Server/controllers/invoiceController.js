const { Invoice, Appointment, Doctor, User, Specialty } = require("../models");
const { createSnapToken } = require("../helpers/midtrans");
const HttpError = require("../helpers/HttpError");
const { INVOICE_STATUS, ROLES } = require("../helpers/constants");
const { isValidDateOnly, toDateOnly } = require("../helpers/date");

async function loadAppointment(appointmentId) {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
  return appointment;
}

async function assertCanReadInvoice(req, invoice) {
  const appointment = await loadAppointment(invoice.appointmentId);
  const { role, id: userId } = req.user;

  if (role === ROLES.PATIENT) {
    if (appointment.patientId !== userId) {
      throw new HttpError(403, "Anda tidak memiliki akses");
    }
    return;
  }

  if (role === ROLES.DOCTOR) {
    const doctor = await Doctor.findByPk(appointment.doctorId);
    if (!doctor || doctor.userId !== userId) {
      throw new HttpError(403, "Anda tidak memiliki akses");
    }
    return;
  }

  throw new HttpError(403, "Anda tidak memiliki akses");
}

async function assertPatientOwnsInvoice(req, invoice) {
  const appointment = await loadAppointment(invoice.appointmentId);
  if (appointment.patientId !== req.user.id) {
    throw new HttpError(403, "Anda tidak memiliki akses");
  }
}

async function detail(req, res, next) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) throw new HttpError(404, "Tagihan tidak ditemukan");
    await assertCanReadInvoice(req, invoice);
    res.status(200).json(invoice);
  } catch (err) {
    next(err);
  }
}

async function pay(req, res, next) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) throw new HttpError(404, "Tagihan tidak ditemukan");
    await assertPatientOwnsInvoice(req, invoice);

    if (invoice.status === INVOICE_STATUS.PAID) {
      throw new HttpError(409, "Tagihan sudah dibayar");
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

async function adminList(req, res, next) {
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

module.exports = { detail, pay, adminList };
