const { Op } = require("sequelize");
const {
  Appointment,
  Message,
  ChatRead,
  Doctor,
  User,
} = require("../models");
const HttpError = require("../helpers/HttpError");
const { ROLES, CHAT_WRITABLE_STATUSES } = require("../helpers/constants");
const { toDateOnly } = require("../helpers/date");
const { emitChatMessage, emitChatRead } = require("../sockets/emit");

function serializeMessage(message, senderRole) {
  return {
    id: message.id,
    appointmentId: message.appointmentId,
    senderId: message.senderId,
    senderRole,
    body: message.body,
    createdAt: message.createdAt,
  };
}

async function loadChatAppointment(appointmentId) {
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: User, as: "Patient", attributes: ["id", "name"] },
      { model: Doctor, include: [{ model: User, attributes: ["id", "name"] }] },
    ],
  });
  if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
  return appointment;
}

async function assertChatParticipant(req, appointment) {
  if (req.user.role === ROLES.PATIENT && appointment.patientId === req.user.id) {
    return;
  }
  if (req.user.role === ROLES.DOCTOR) {
    if (appointment.Doctor?.userId === req.user.id) return;
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (doctor && appointment.doctorId === doctor.id) return;
  }
  throw new HttpError(403, "Anda tidak memiliki akses");
}

function counterpartName(req, appointment) {
  if (req.user.role === ROLES.PATIENT) {
    return appointment.Doctor?.User?.name || "Dokter";
  }
  return appointment.Patient?.name || "Pasien";
}

function senderRoleFor(appointment, senderId) {
  if (senderId === appointment.patientId) return ROLES.PATIENT;
  return ROLES.DOCTOR;
}

async function inbox(req, res, next) {
  try {
    if (req.user.role === ROLES.ADMIN) {
      throw new HttpError(403, "Admin tidak dapat mengakses chat");
    }

    const where = {};
    if (req.user.role === ROLES.PATIENT) {
      where.patientId = req.user.id;
    } else if (req.user.role === ROLES.DOCTOR) {
      const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (!doctor) throw new HttpError(403, "Profil dokter tidak ditemukan");
      where.doctorId = doctor.id;
    } else {
      throw new HttpError(403, "Anda tidak memiliki akses");
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: "Patient", attributes: ["id", "name"] },
        { model: Doctor, include: [{ model: User, attributes: ["id", "name"] }] },
      ],
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });

    const threads = [];
    for (const appointment of appointments) {
      const lastMessage = await Message.findOne({
        where: { appointmentId: appointment.id },
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
      });
      const chatRead = await ChatRead.findOne({
        where: { appointmentId: appointment.id, userId: req.user.id },
      });
      const unreadWhere = {
        appointmentId: appointment.id,
        senderId: { [Op.ne]: req.user.id },
      };
      if (chatRead?.lastReadAt) {
        unreadWhere.createdAt = { [Op.gt]: chatRead.lastReadAt };
      }
      const unreadCount = await Message.count({ where: unreadWhere });

      threads.push({
        appointmentId: appointment.id,
        counterpartName: counterpartName(req, appointment),
        status: appointment.status,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        date: toDateOnly(appointment.date),
        session: appointment.session,
      });
    }

    res.status(200).json(threads);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const appointment = await loadChatAppointment(req.params.id);
    await assertChatParticipant(req, appointment);

    const messages = await Message.findAll({
      where: { appointmentId: appointment.id },
      order: [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.status(200).json(
      messages.map((message) =>
        serializeMessage(message, senderRoleFor(appointment, message.senderId))
      )
    );
  } catch (err) {
    next(err);
  }
}

async function createMessage(req, res, next) {
  try {
    const appointment = await loadChatAppointment(req.params.id);
    await assertChatParticipant(req, appointment);

    if (!CHAT_WRITABLE_STATUSES.includes(appointment.status)) {
      throw new HttpError(409, "Chat sudah ditutup");
    }

    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
    if (!body) throw new HttpError(400, "Pesan tidak boleh kosong");
    if (body.length > 1000) throw new HttpError(400, "Pesan maksimal 1000 karakter");

    const message = await Message.create({
      appointmentId: appointment.id,
      senderId: req.user.id,
      body,
    });

    const payload = serializeMessage(message, req.user.role);
    emitChatMessage(appointment.id, payload);

    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const appointment = await loadChatAppointment(req.params.id);
    await assertChatParticipant(req, appointment);

    const lastReadAt = new Date();
    const [chatRead, created] = await ChatRead.findOrCreate({
      where: { appointmentId: appointment.id, userId: req.user.id },
      defaults: { lastReadAt },
    });
    if (!created) {
      await chatRead.update({ lastReadAt });
    }

    emitChatRead(appointment.id, {
      userId: req.user.id,
      lastReadAt: chatRead.lastReadAt,
    });

    res.status(200).json({
      appointmentId: appointment.id,
      userId: req.user.id,
      lastReadAt: chatRead.lastReadAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { inbox, listMessages, createMessage, markRead };
