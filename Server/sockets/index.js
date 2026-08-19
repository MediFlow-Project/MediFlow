const { Server } = require("socket.io");
const { User, Doctor, Appointment } = require("../models");
const { verifyToken } = require("../helpers/jwt");
const { ROLES } = require("../helpers/constants");
const {
  setIo,
  queueRoom,
  chatRoom,
  emitChatTyping,
} = require("./emit");

function parseQueueRoom(room) {
  const match = String(room).match(/^queue:(\d+):(\d{4}-\d{2}-\d{2}):(morning|afternoon)$/);
  if (!match) return null;
  return {
    doctorId: Number(match[1]),
    date: match[2],
    session: match[3],
  };
}

function parseChatRoom(room) {
  const match = String(room).match(/^chat:(\d+)$/);
  if (!match) return null;
  return { appointmentId: Number(match[1]) };
}

async function canJoinQueue(user, { doctorId, date, session }) {
  if (user.role === ROLES.ADMIN) return true;

  if (user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ where: { userId: user.id } });
    return Boolean(doctor && doctor.id === doctorId);
  }

  if (user.role === ROLES.PATIENT) {
    const appointment = await Appointment.findOne({
      where: { patientId: user.id, doctorId, date, session },
    });
    return Boolean(appointment);
  }

  return false;
}

async function canJoinChat(user, appointmentId) {
  if (user.role === ROLES.ADMIN) return false;

  const appointment = await Appointment.findByPk(appointmentId, {
    include: [{ model: Doctor }],
  });
  if (!appointment) return false;

  if (user.role === ROLES.PATIENT) {
    return appointment.patientId === user.id;
  }

  if (user.role === ROLES.DOCTOR) {
    return appointment.Doctor?.userId === user.id;
  }

  return false;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.CORS_ORIGIN,
      ].filter(Boolean),
      credentials: true,
    },
  });

  setIo(io);

  io.use(async (socket, next) => {
    try {
      const header = socket.handshake.headers.authorization;
      const tokenFromHeader = header?.startsWith("Bearer ") ? header.slice(7) : null;
      const token = socket.handshake.auth?.token || tokenFromHeader;
      if (!token) return next(new Error("Silakan login terlebih dahulu"));

      const payload = verifyToken(token);
      const user = await User.findByPk(payload.userId);
      if (!user) return next(new Error("Silakan login terlebih dahulu"));

      socket.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };
      next();
    } catch (err) {
      next(new Error("Silakan login terlebih dahulu"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", async (payload, ack) => {
      try {
        const room = typeof payload === "string" ? payload : payload?.room;
        if (!room) {
          ack?.({ ok: false, error: "Room wajib diisi" });
          return;
        }

        const queue = parseQueueRoom(room);
        if (queue) {
          const allowed = await canJoinQueue(socket.user, queue);
          if (!allowed) {
            ack?.({ ok: false, error: "Anda tidak dapat bergabung ke antrean ini" });
            return;
          }
          await socket.join(queueRoom(queue.doctorId, queue.date, queue.session));
          ack?.({ ok: true, room: queueRoom(queue.doctorId, queue.date, queue.session) });
          return;
        }

        const chat = parseChatRoom(room);
        if (chat) {
          const allowed = await canJoinChat(socket.user, chat.appointmentId);
          if (!allowed) {
            ack?.({ ok: false, error: "Anda tidak dapat bergabung ke chat ini" });
            return;
          }
          await socket.join(chatRoom(chat.appointmentId));
          ack?.({ ok: true, room: chatRoom(chat.appointmentId) });
          return;
        }

        ack?.({ ok: false, error: "Nama room tidak valid" });
      } catch (err) {
        ack?.({ ok: false, error: "Gagal bergabung ke room" });
      }
    });

    socket.on("leave", async (payload, ack) => {
      const room = typeof payload === "string" ? payload : payload?.room;
      if (room) await socket.leave(room);
      ack?.({ ok: true });
    });

    socket.on("chat:typing", async (payload = {}) => {
      try {
        const appointmentId = Number(payload.appointmentId);
        if (!appointmentId) return;
        const allowed = await canJoinChat(socket.user, appointmentId);
        if (!allowed) return;
        emitChatTyping(
          appointmentId,
          { userId: socket.user.id, isTyping: Boolean(payload.isTyping) },
          { exceptSocketId: socket.id }
        );
      } catch (err) {
        // typing is best-effort
      }
    });
  });

  return io;
}

module.exports = {
  initSocket,
  ...require("./emit"),
};
