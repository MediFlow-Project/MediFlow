const { Invoice, Appointment, Doctor } = require("../models");
const { createSnapToken } = require("../helpers/midtrans");

function sendError(res, error) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: error.errors[0]?.message || "Data tagihan tidak valid",
    });
  }
  return res.status(500).json({ error: "Terjadi kesalahan pada server" });
}

async function loadAppointment(appointmentId) {
  if (!Appointment) {
    return { error: "Data appointment belum tersedia", status: 503 };
  }

  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    return { error: "Janji temu tidak ditemukan", status: 404 };
  }

  return { appointment };
}

async function assertCanReadInvoice(req, invoice) {
  const loaded = await loadAppointment(invoice.appointmentId);
  if (loaded.error) return loaded;

  const { appointment } = loaded;
  const { role, id: userId } = req.user;

  if (role === "patient") {
    if (appointment.patientId !== userId) {
      return { error: "Akses ditolak", status: 403 };
    }
    return {};
  }

  if (role === "doctor") {
    if (!Doctor) {
      return { error: "Data dokter belum tersedia", status: 503 };
    }
    const doctor = await Doctor.findByPk(appointment.doctorId);
    if (!doctor || doctor.userId !== userId) {
      return { error: "Akses ditolak", status: 403 };
    }
    return {};
  }

  return { error: "Akses ditolak", status: 403 };
}

async function assertPatientOwnsInvoice(req, invoice) {
  const loaded = await loadAppointment(invoice.appointmentId);
  if (loaded.error) return loaded;

  if (req.user.role !== "patient" || loaded.appointment.patientId !== req.user.id) {
    return { error: "Akses ditolak", status: 403 };
  }

  return {};
}

async function detail(req, res) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan" });
    }

    const access = await assertCanReadInvoice(req, invoice);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    res.status(200).json(invoice);
  } catch (error) {
    sendError(res, error);
  }
}

async function pay(req, res) {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Tagihan tidak ditemukan" });
    }

    const access = await assertPatientOwnsInvoice(req, invoice);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    if (invoice.status === "paid") {
      return res.status(409).json({ error: "Tagihan sudah dibayar" });
    }

    const result = await createSnapToken(invoice);
    await invoice.update({
      midtransOrderId: result.orderId,
      snapToken: result.snapToken,
      status: "pending",
    });

    res.status(200).json({
      snapToken: result.snapToken,
      clientKey: result.clientKey,
    });
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = { detail, pay };
