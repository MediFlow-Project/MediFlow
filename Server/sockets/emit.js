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

function userRoom(userId) {
  return `user:${Number(userId)}`;
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

function emitToChatAndUser(appointmentId, counterpartUserId, event, payload, exceptSocketId) {
  const nsp = getIo();
  if (!nsp) return payload;
  const chat = nsp.to(chatRoom(appointmentId));
  if (exceptSocketId) {
    chat.except(exceptSocketId).emit(event, payload);
  } else {
    chat.emit(event, payload);
  }
  if (counterpartUserId) {
    const personal = nsp.to(userRoom(counterpartUserId));
    if (exceptSocketId) {
      personal.except(exceptSocketId).emit(event, payload);
    } else {
      personal.emit(event, payload);
    }
  }
  return payload;
}

function emitChatMessage(appointmentId, message, { counterpartUserId, senderName } = {}) {
  const payload = {
    appointmentId: Number(appointmentId),
    message,
    senderName: senderName || message?.senderName || null,
  };
  return emitToChatAndUser(appointmentId, counterpartUserId, "chat:message", payload);
}

function emitChatTyping(
  appointmentId,
  { userId, isTyping },
  { exceptSocketId, counterpartUserId } = {}
) {
  const payload = {
    appointmentId: Number(appointmentId),
    userId,
    isTyping: Boolean(isTyping),
  };
  return emitToChatAndUser(
    appointmentId,
    counterpartUserId,
    "chat:typing",
    payload,
    exceptSocketId
  );
}

function emitChatRead(appointmentId, { userId, lastReadAt, lastReadMessageId }) {
  const payload = {
    appointmentId: Number(appointmentId),
    userId,
    lastReadAt,
    lastReadMessageId: lastReadMessageId || null,
  };
  getIo()?.to(chatRoom(appointmentId)).emit("chat:read", payload);
  return payload;
}

function emitNotification(notification) {
  const userId = Number(notification?.userId);
  if (!userId) return notification;
  getIo()?.to(userRoom(userId)).emit("notification:new", notification);
  return notification;
}

module.exports = {
  setIo,
  getIo,
  queueRoom,
  chatRoom,
  userRoom,
  emitQueueUpdated,
  emitQueueCalled,
  emitQueueCompleted,
  emitChatMessage,
  emitChatTyping,
  emitChatRead,
  emitNotification,
};
