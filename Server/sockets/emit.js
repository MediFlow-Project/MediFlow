let io = null;

function setIo(instance) {
  io = instance;
}

function getIo() {
  return io;
}

function queueRoom(doctorId, date, session) {
  return `queue:${doctorId}:${date}:${session}`;
}

function chatRoom(appointmentId) {
  return `chat:${appointmentId}`;
}

async function emitQueueUpdated(doctorId, date, session) {
  const { buildQueuePayload } = require("../helpers/queuePayload");
  const { toDateOnly } = require("../helpers/date");
  const dateOnly = toDateOnly(date);
  const payload = await buildQueuePayload(doctorId, dateOnly, session, {
    includeAppointmentId: false,
  });
  getIo()?.to(queueRoom(doctorId, dateOnly, session)).emit("queue:updated", payload);
  return payload;
}

function emitQueueCalled({ doctorId, date, session, queueNumber, appointmentId, calledAt }) {
  const { toDateOnly } = require("../helpers/date");
  const dateOnly = toDateOnly(date);
  const payload = {
    doctorId: Number(doctorId),
    date: dateOnly,
    session,
    queueNumber,
    appointmentId,
    calledAt: calledAt || new Date().toISOString(),
  };
  getIo()?.to(queueRoom(doctorId, dateOnly, session)).emit("queue:called", payload);
  return payload;
}

function emitQueueCompleted({ doctorId, date, session, queueNumber, appointmentId }) {
  const { toDateOnly } = require("../helpers/date");
  const dateOnly = toDateOnly(date);
  const payload = {
    doctorId: Number(doctorId),
    date: dateOnly,
    session,
    queueNumber,
    appointmentId,
  };
  getIo()?.to(queueRoom(doctorId, dateOnly, session)).emit("queue:completed", payload);
  return payload;
}

function emitChatMessage(appointmentId, message) {
  const payload = { appointmentId: Number(appointmentId), message };
  getIo()?.to(chatRoom(appointmentId)).emit("chat:message", payload);
  return payload;
}

function emitChatTyping(appointmentId, { userId, isTyping }, { exceptSocketId } = {}) {
  const payload = {
    appointmentId: Number(appointmentId),
    userId,
    isTyping: Boolean(isTyping),
  };
  const room = chatRoom(appointmentId);
  const nsp = getIo();
  if (!nsp) return payload;
  if (exceptSocketId) {
    nsp.to(room).except(exceptSocketId).emit("chat:typing", payload);
  } else {
    nsp.to(room).emit("chat:typing", payload);
  }
  return payload;
}

function emitChatRead(appointmentId, { userId, lastReadAt }) {
  const payload = {
    appointmentId: Number(appointmentId),
    userId,
    lastReadAt,
  };
  getIo()?.to(chatRoom(appointmentId)).emit("chat:read", payload);
  return payload;
}

module.exports = {
  setIo,
  getIo,
  queueRoom,
  chatRoom,
  emitQueueUpdated,
  emitQueueCalled,
  emitQueueCompleted,
  emitChatMessage,
  emitChatTyping,
  emitChatRead,
};
