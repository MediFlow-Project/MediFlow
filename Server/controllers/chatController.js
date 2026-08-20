const { Op } = require("sequelize");
const {
  Appointment,
  Message,
  ChatRead,
  Doctor,
  User,
} = require("../models");
const HttpError = require("../helpers/HttpError");
const { ROLES } = require("../helpers/constants");
const { toDateOnly } = require("../helpers/date");
const { isChatWritable, chatWriteError } = require("../helpers/chatAccess");
const { emitChatMessage, emitChatRead } = require("../sockets/emit");

function serializeMessage(message, senderRole, lastReadMessageId = null) {
  const id = Number(message.id);
  return {
    id: message.id,
    appointmentId: message.appointmentId,
    senderId: message.senderId,
    senderRole,
    body: message.body,
    createdAt: message.createdAt,
    read: Boolean(lastReadMessageId && id <= lastReadMessageId),
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

function counterpartImgUrl(req, appointment) {
  if (req.user.role === ROLES.PATIENT) {
    return appointment.Doctor?.imgUrl || null;
  }
  return null;
}

function counterpartUserId(req, appointment) {
  if (req.user.role === ROLES.PATIENT) {
    return appointment.Doctor?.userId || appointment.Doctor?.User?.id || null;
  }
  return appointment.patientId || appointment.Patient?.id || null;
}

function positiveId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function latestMessageId(appointmentId) {
  const maxId = await Message.max("id", { where: { appointmentId } });
  return positiveId(maxId);
}

async function findCounterpartRead(req, appointment) {
  const myId = Number(req.user.id);
  const rows = (await ChatRead.findAll({
    where: { appointmentId: appointment.id },
  })) || [];
  const other = rows.find((row) => Number(row.userId) !== myId);
  if (other) return other;

  const counterpartId = counterpartUserId(req, appointment);
  if (!counterpartId) return null;
  return (
    rows.find((row) => Number(row.userId) === Number(counterpartId)) || null
  );
}

function lastReadIdFromMessages(messages, lastReadAt) {
  if (!lastReadAt || !messages.length) return null;
  const readAt = new Date(lastReadAt).getTime();
  if (Number.isNaN(readAt)) return null;
  let maxId = 0;
  for (const message of messages) {
    const created = new Date(message.createdAt).getTime();
    if (Number.isNaN(created) || created > readAt + 5000) continue;
    const id = Number(message.id);
    if (id > maxId) maxId = id;
  }
  return positiveId(maxId);
}

async function counterpartLastReadMessageId(appointmentId, chatRead, messages) {
  const stored = positiveId(chatRead?.lastReadMessageId);
  if (stored) return stored;
  const fromTime = lastReadIdFromMessages(messages, chatRead?.lastReadAt);
  if (fromTime) {
    if (chatRead?.update) {
      await chatRead.update({ lastReadMessageId: fromTime });
    }
    return fromTime;
  }
  return null;
}

function senderRoleFor(appointment, senderId) {
  if (senderId === appointment.patientId) return ROLES.PATIENT;
  return ROLES.DOCTOR;
}

class ChatController {
  static async inbox(req, res, next) {
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
        const lastReadId = positiveId(chatRead?.lastReadMessageId);
        if (lastReadId) {
          unreadWhere.id = { [Op.gt]: lastReadId };
        } else if (chatRead?.lastReadAt) {
          unreadWhere.createdAt = { [Op.gt]: chatRead.lastReadAt };
        }
        const unreadCount = await Message.count({ where: unreadWhere });

        threads.push({
          appointmentId: appointment.id,
          counterpartName: counterpartName(req, appointment),
          counterpartImgUrl: counterpartImgUrl(req, appointment),
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
          writable: isChatWritable(appointment),
        });
      }

      res.status(200).json(threads);
    } catch (err) {
      next(err);
    }
  }

  static async listMessages(req, res, next) {
    try {
      const appointment = await loadChatAppointment(req.params.id);
      await assertChatParticipant(req, appointment);

      const messages = (await Message.findAll({
        where: { appointmentId: appointment.id },
        order: [
          ["createdAt", "ASC"],
          ["id", "ASC"],
        ],
      })) || [];

      const counterpartRead = await findCounterpartRead(req, appointment);
      const lastReadMessageId = await counterpartLastReadMessageId(
        appointment.id,
        counterpartRead,
        messages
      );

      res.status(200).json({
        messages: messages.map((message) =>
          serializeMessage(
            message,
            senderRoleFor(appointment, message.senderId),
            lastReadMessageId
          )
        ),
        counterpartLastReadAt: counterpartRead?.lastReadAt || null,
        counterpartLastReadMessageId: lastReadMessageId,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createMessage(req, res, next) {
    try {
      const appointment = await loadChatAppointment(req.params.id);
      await assertChatParticipant(req, appointment);

      if (!isChatWritable(appointment)) {
        throw new HttpError(409, chatWriteError(appointment));
      }

      const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
      if (!body) throw new HttpError(400, "Pesan tidak boleh kosong");
      if (body.length > 1000) throw new HttpError(400, "Pesan maksimal 1000 karakter");

      const message = await Message.create({
        appointmentId: appointment.id,
        senderId: req.user.id,
        body,
      });

      const payload = serializeMessage(message, req.user.role, null);
      emitChatMessage(appointment.id, payload, {
        counterpartUserId: counterpartUserId(req, appointment),
        senderName: req.user.name,
      });

      res.status(201).json(payload);
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req, res, next) {
    try {
      const appointment = await loadChatAppointment(req.params.id);
      await assertChatParticipant(req, appointment);

      const lastReadAt = new Date();
      const lastReadMessageId = await latestMessageId(appointment.id);
      const [chatRead, created] = await ChatRead.findOrCreate({
        where: { appointmentId: appointment.id, userId: req.user.id },
        defaults: { lastReadAt, lastReadMessageId },
      });
      if (!created) {
        const patch = {};
        const prevMs = chatRead.lastReadAt
          ? new Date(chatRead.lastReadAt).getTime()
          : 0;
        if (lastReadAt.getTime() > prevMs) patch.lastReadAt = lastReadAt;
        const prevId = positiveId(chatRead.lastReadMessageId) || 0;
        if (lastReadMessageId && lastReadMessageId > prevId) {
          patch.lastReadMessageId = lastReadMessageId;
        }
        if (Object.keys(patch).length) {
          await chatRead.update(patch);
          Object.assign(chatRead, patch);
        }
      }

      const readAt = chatRead.lastReadAt;
      const readMessageId = positiveId(chatRead.lastReadMessageId);
      emitChatRead(appointment.id, {
        userId: req.user.id,
        lastReadAt: readAt,
        lastReadMessageId: readMessageId,
      });

      res.status(200).json({
        appointmentId: appointment.id,
        userId: req.user.id,
        lastReadAt: readAt,
        lastReadMessageId: readMessageId,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ChatController;
