jest.mock("../models", () => ({
  User: { findByPk: jest.fn() },
  Doctor: { findOne: jest.fn() },
  Appointment: { findOne: jest.fn(), findByPk: jest.fn() },
}));
jest.mock("../helpers/jwt", () => ({
  verifyToken: jest.fn(),
}));
jest.mock("../sockets/emit", () => ({
  setIo: jest.fn(),
  queueRoom: (d, date, s) => `queue:${d}:${date}:${s}`,
  chatRoom: (id) => `chat:${id}`,
  userRoom: (id) => `user:${id}`,
  emitChatTyping: jest.fn(),
}));

const { Server } = require("socket.io");
jest.mock("socket.io", () => ({
  Server: jest.fn(),
}));

const { User, Doctor, Appointment } = require("../models");
const { verifyToken } = require("../helpers/jwt");
const { initSocket } = require("../sockets");
const { emitChatTyping } = require("../sockets/emit");

function makeSocket() {
  const handlers = {};
  return {
    handshake: { headers: {}, auth: { token: "tok" } },
    user: null,
    join: jest.fn().mockResolvedValue(),
    leave: jest.fn().mockResolvedValue(),
    on: (event, fn) => {
      handlers[event] = fn;
    },
    emitHandler: (event, ...args) => handlers[event](...args),
    id: "sock-1",
  };
}

describe("initSocket", () => {
  let useFn;
  let connectionFn;
  let io;

  beforeEach(() => {
    useFn = null;
    connectionFn = null;
    io = {
      use: jest.fn((fn) => {
        useFn = fn;
      }),
      on: jest.fn((event, fn) => {
        if (event === "connection") connectionFn = fn;
      }),
    };
    Server.mockImplementation(() => io);
  });

  it("authenticates sockets and joins rooms", async () => {
    initSocket({});
    const next = jest.fn();
    verifyToken.mockReturnValue({ userId: 1 });
    User.findByPk.mockResolvedValue({ id: 1, name: "A", role: "patient" });
    const socket = makeSocket();
    await useFn(socket, next);
    expect(next).toHaveBeenCalledWith();

    const nextErr = jest.fn();
    socket.handshake.auth = {};
    await useFn(socket, nextErr);
    expect(nextErr.mock.calls[0][0]).toBeInstanceOf(Error);

    socket.handshake.auth = { token: "tok" };
    User.findByPk.mockResolvedValue(null);
    await useFn(socket, jest.fn());
    verifyToken.mockImplementation(() => {
      throw new Error("bad");
    });
    await useFn(socket, jest.fn());
    verifyToken.mockReturnValue({ userId: 1 });
    User.findByPk.mockResolvedValue({ id: 1, name: "A", role: "patient" });
    socket.handshake.headers.authorization = "Bearer tok";
    await useFn(socket, jest.fn());

    connectionFn(socket);
    expect(socket.join).toHaveBeenCalledWith("user:1");
    const ack = jest.fn();
    await socket.emitHandler("join", null, ack);
    expect(ack).toHaveBeenCalledWith({ ok: false, error: "Room wajib diisi" });
    await socket.emitHandler("join", "queue:bad", ack);
    Appointment.findOne.mockResolvedValue({ id: 1 });
    await socket.emitHandler("join", "queue:2:2026-08-20:morning", ack);
    expect(ack).toHaveBeenCalledWith({ ok: true, room: "queue:2:2026-08-20:morning" });
    Appointment.findOne.mockResolvedValue(null);
    await socket.emitHandler("join", "queue:2:2026-08-20:morning", ack);

    socket.user.role = "doctor";
    Doctor.findOne.mockResolvedValue({ id: 2 });
    await socket.emitHandler("join", { room: "queue:2:2026-08-20:afternoon" }, ack);
    Doctor.findOne.mockResolvedValue({ id: 9 });
    await socket.emitHandler("join", "queue:2:2026-08-20:afternoon", ack);

    socket.user.role = "admin";
    await socket.emitHandler("join", "queue:2:2026-08-20:morning", ack);

    socket.user.role = "nurse";
    await socket.emitHandler("join", "queue:2:2026-08-20:morning", ack);

    socket.user = { id: 10, role: "patient" };
    Appointment.findByPk.mockResolvedValue({ patientId: 10, Doctor: { userId: 20 } });
    await socket.emitHandler("join", "chat:3", ack);
    Appointment.findByPk.mockResolvedValue({ patientId: 99, Doctor: { userId: 20 } });
    await socket.emitHandler("join", "chat:3", ack);
    socket.user.role = "doctor";
    Appointment.findByPk.mockResolvedValue({ patientId: 10, Doctor: { userId: 20 } });
    socket.user.id = 20;
    await socket.emitHandler("join", "chat:3", ack);
    socket.user.role = "admin";
    await socket.emitHandler("join", "chat:3", ack);
    Appointment.findByPk.mockResolvedValue(null);
    socket.user.role = "patient";
    await socket.emitHandler("join", "chat:3", ack);

    await socket.emitHandler("leave", "queue:2:2026-08-20:morning", ack);
    await socket.emitHandler("leave", {}, ack);
    await socket.emitHandler("chat:typing", {});
    Appointment.findByPk.mockResolvedValue({ patientId: 10, Doctor: { userId: 20 } });
    socket.user = { id: 10, role: "patient" };
    await socket.emitHandler("chat:typing", { appointmentId: 3, isTyping: true });
    expect(emitChatTyping).toHaveBeenCalledWith(
      3,
      { userId: 10, isTyping: true },
      expect.objectContaining({ counterpartUserId: 20, exceptSocketId: "sock-1" })
    );
    socket.user = { id: 20, role: "doctor" };
    await socket.emitHandler("chat:typing", { appointmentId: 3, isTyping: false });
    expect(emitChatTyping).toHaveBeenCalledWith(
      3,
      { userId: 20, isTyping: false },
      expect.objectContaining({ counterpartUserId: 10 })
    );
    Appointment.findByPk.mockRejectedValue(new Error("db"));
    await socket.emitHandler("chat:typing", { appointmentId: 3, isTyping: true });
    Appointment.findByPk.mockImplementation(() => {
      throw new Error("join fail");
    });
    await socket.emitHandler("join", "queue:2:2026-08-20:morning", ack);
  });
});
