import { io } from "socket.io-client";
import { getStoredToken } from "./api/http";

let socket = null;

export function connectSocket(token = getStoredToken()) {
  if (!token) return null;
  if (socket?.connected) return socket;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function joinRoom(room) {
  const current = connectSocket();
  if (!current || !room) return Promise.resolve({ ok: false });
  return new Promise((resolve) => {
    current.emit("join", room, (ack) => resolve(ack || { ok: true, room }));
  });
}

export function leaveRoom(room) {
  const current = getSocket();
  if (!current || !room) return;
  current.emit("leave", room);
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function emitChatTyping(appointmentId, isTyping) {
  const current = getSocket();
  if (!current || !appointmentId) return;
  current.emit("chat:typing", { appointmentId, isTyping: Boolean(isTyping) });
}
