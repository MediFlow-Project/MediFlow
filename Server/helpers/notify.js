const { Notification } = require("../models");
const { NOTIFICATION_TYPES, INVOICE_STATUS, ROLES } = require("./constants");
const { toDateOnly } = require("./date");

const SESSION_LABEL = {
  morning: "Pagi",
  afternoon: "Siang",
};

function sessionLabel(session) {
  return SESSION_LABEL[session] || session;
}

function padQueue(number) {
  return String(number ?? "").padStart(2, "0");
}

function formatFee(amount) {
  const n = Number(amount) || 0;
  return `Rp${n.toLocaleString("id-ID")}`;
}

function serializeNotification(row) {
  const json = typeof row?.toJSON === "function" ? row.toJSON() : row || {};
  return {
    id: json.id ?? null,
    userId: Number(json.userId) || null,
    type: json.type,
    title: json.title,
    message: json.message,
    href: json.href || null,
    appointmentId: json.appointmentId || null,
    invoiceId: json.invoiceId || null,
    readAt: json.readAt || null,
    createdAt: json.createdAt || new Date().toISOString(),
  };
}

async function createNotification(fields) {
  try {
    const { emitNotification } = require("../sockets/emit");
    const row = await Notification.create({
      userId: fields.userId,
      type: fields.type,
      title: fields.title,
      message: fields.message,
      href: fields.href || null,
      appointmentId: fields.appointmentId || null,
      invoiceId: fields.invoiceId || null,
      readAt: null,
    });
    const payload = serializeNotification(row);
    if (typeof emitNotification === "function") emitNotification(payload);
    return payload;
  } catch (err) {
    return null;
  }
}

async function notifyQueueCalled(appointment) {
  if (!appointment?.patientId) return null;
  const number = padQueue(appointment.queueNumber);
  return createNotification({
    userId: appointment.patientId,
    type: NOTIFICATION_TYPES.QUEUE_CALLED,
    title: "Giliran Anda",
    message: `Nomor ${number} dipanggil. Silakan ke ruang praktik.`,
    href: `/saya/antrean/${appointment.id}`,
    appointmentId: appointment.id,
  });
}

async function notifyQueueSkipped(appointment) {
  if (!appointment?.patientId) return null;
  const number = padQueue(appointment.queueNumber);
  return createNotification({
    userId: appointment.patientId,
    type: NOTIFICATION_TYPES.QUEUE_SKIPPED,
    title: "Nomor dilewati",
    message: `Nomor ${number} dilewati. Hubungi petugas jika Anda masih di lokasi.`,
    href: `/saya/antrean/${appointment.id}`,
    appointmentId: appointment.id,
  });
}

async function notifySessionOpened(appointments) {
  const list = Array.isArray(appointments) ? appointments : [];
  const results = [];
  for (const appointment of list) {
    if (!appointment?.patientId) continue;
    const date = toDateOnly(appointment.date);
    results.push(
      await createNotification({
        userId: appointment.patientId,
        type: NOTIFICATION_TYPES.SESSION_OPENED,
        title: "Sesi dibuka",
        message: `Sesi ${sessionLabel(appointment.session)} ${date} sudah dibuka. Silakan menunggu di antrean.`,
        href: `/saya/antrean/${appointment.id}`,
        appointmentId: appointment.id,
      })
    );
  }
  return results;
}

async function notifyBookingCreated(appointment) {
  const doctorUserId = appointment?.Doctor?.userId;
  if (!doctorUserId) return null;
  const patientName = appointment.Patient?.name || "Pasien";
  const date = toDateOnly(appointment.date);
  return createNotification({
    userId: doctorUserId,
    type: NOTIFICATION_TYPES.BOOKING_CREATED,
    title: "Kunjungan baru",
    message: `${patientName} mendaftar sesi ${sessionLabel(appointment.session)} ${date}, nomor ${padQueue(appointment.queueNumber)}.`,
    href: "/dokter",
    appointmentId: appointment.id,
  });
}

async function notifyAppointmentCancelled(appointment, actor) {
  if (!appointment) return [];
  const date = toDateOnly(appointment.date);
  const session = sessionLabel(appointment.session);
  const actorId = Number(actor?.id);
  const actorRole = actor?.role;
  const patientId = Number(appointment.patientId);
  const doctorUserId = Number(appointment.Doctor?.userId);
  const results = [];

  const payload = {
    type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
    title: "Kunjungan dibatalkan",
    appointmentId: appointment.id,
  };

  if (patientId && actorId !== patientId) {
    results.push(
      await createNotification({
        ...payload,
        userId: patientId,
        message: `Kunjungan sesi ${session} ${date} dibatalkan.`,
        href: "/saya",
      })
    );
  }

  if (doctorUserId && actorId !== doctorUserId) {
    const patientName = appointment.Patient?.name || "Pasien";
    const who = actorRole === ROLES.ADMIN ? "Administrasi" : patientName;
    results.push(
      await createNotification({
        ...payload,
        userId: doctorUserId,
        message: `${who} membatalkan sesi ${session} ${date}.`,
        href: "/dokter",
      })
    );
  }

  return results;
}

async function notifyInvoiceCreated(appointment, invoice) {
  if (!appointment?.patientId || !invoice?.id) return null;
  return createNotification({
    userId: appointment.patientId,
    type: NOTIFICATION_TYPES.INVOICE_CREATED,
    title: "Tagihan baru",
    message: `Tagihan ${formatFee(invoice.amount)} siap dibayar.`,
    href: `/tagihan/${invoice.id}`,
    appointmentId: appointment.id,
    invoiceId: invoice.id,
  });
}

const INVOICE_STATUS_COPY = {
  [INVOICE_STATUS.PAID]: {
    type: NOTIFICATION_TYPES.INVOICE_PAID,
    title: "Pembayaran lunas",
    message: (amount) => `Pembayaran ${formatFee(amount)} berhasil.`,
  },
  [INVOICE_STATUS.FAILED]: {
    type: NOTIFICATION_TYPES.INVOICE_FAILED,
    title: "Pembayaran gagal",
    message: () => "Pembayaran gagal. Silakan coba lagi.",
  },
  [INVOICE_STATUS.EXPIRE]: {
    type: NOTIFICATION_TYPES.INVOICE_EXPIRED,
    title: "Pembayaran kedaluwarsa",
    message: () => "Batas waktu pembayaran habis. Buat pembayaran baru jika masih diperlukan.",
  },
};

async function notifyInvoiceStatusChange(invoice, appointment) {
  const copy = INVOICE_STATUS_COPY[invoice?.status];
  const patientId = appointment?.patientId;
  if (!copy || !patientId || !invoice?.id) return null;

  try {
    const existing = await Notification.findOne({
      where: {
        userId: patientId,
        type: copy.type,
        invoiceId: invoice.id,
      },
    });
    if (existing) return serializeNotification(existing);
  } catch (err) {
    // ignore lookup errors and still try to create
  }

  return createNotification({
    userId: patientId,
    type: copy.type,
    title: copy.title,
    message: copy.message(invoice.amount),
    href: `/tagihan/${invoice.id}`,
    appointmentId: appointment?.id || invoice.appointmentId,
    invoiceId: invoice.id,
  });
}

module.exports = {
  serializeNotification,
  createNotification,
  notifyQueueCalled,
  notifyQueueSkipped,
  notifySessionOpened,
  notifyBookingCreated,
  notifyAppointmentCancelled,
  notifyInvoiceCreated,
  notifyInvoiceStatusChange,
};
