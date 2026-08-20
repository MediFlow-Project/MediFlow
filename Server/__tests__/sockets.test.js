jest.mock("socket.io", () => {
  function Server() {
    const io = {
      use(fn) {
        io.middleware = fn;
      },
      on(event, fn) {
        io.handlers = io.handlers || {};
        io.handlers[event] = fn;
      },
    };
    Server.instance = io;
    return io;
  }
  return { Server };
});

const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("../sockets");
const emit = require("../sockets/emit");
const { resetDatabase } = require("../tests/helpers/db");
const { seedSalsaFixture } = require("../tests/helpers/seed");
const { hashPassword } = require("../helpers/bcrypt");
const db = require("../models");

function mockRoomIo() {
  const emitFn = jest.fn();
  const exceptEmit = jest.fn();
  const except = jest.fn(() => ({ emit: exceptEmit }));
  const to = jest.fn(() => ({ emit: emitFn, except }));
  return { io: { to }, emitFn, except, exceptEmit };
}

describe("sockets/emit dan initSocket", () => {
  let fx;
  let httpServer;

  beforeAll(async () => {
    await resetDatabase();
    fx = await seedSalsaFixture();
    process.env.CORS_ORIGIN = "http://localhost:3000";
    httpServer = http.createServer();
    initSocket(httpServer);
  });

  afterAll(() => {
    emit.setIo(null);
    httpServer.close();
  });

  test("nama room antrean dan chat", () => {
    expect(emit.queueRoom(3, "2026-08-20", "morning")).toBe(
      "queue:3:2026-08-20:morning"
    );
    expect(emit.chatRoom(9)).toBe("chat:9");
  });

  test("emit queue dan chat saat io terpasang", async () => {
    const mocked = mockRoomIo();
    emit.setIo(mocked.io);

    const updated = await emit.emitQueueUpdated(fx.doctor.id, fx.date, "morning");
    expect(updated.doctorId).toBe(fx.doctor.id);
    expect(mocked.io.to).toHaveBeenCalled();
    expect(mocked.emitFn).toHaveBeenCalledWith("queue:updated", expect.any(Object));

    const called = emit.emitQueueCalled({
      doctorId: fx.doctor.id,
      date: fx.date,
      session: "morning",
      queueNumber: 1,
      appointmentId: fx.booked.id,
    });
    expect(called.calledAt).toEqual(expect.any(String));
    expect(mocked.emitFn).toHaveBeenCalledWith("queue:called", called);

    const calledFixed = emit.emitQueueCalled({
      doctorId: fx.doctor.id,
      date: fx.date,
      session: "morning",
      queueNumber: 1,
      appointmentId: fx.booked.id,
      calledAt: "2026-08-20T01:00:00.000Z",
    });
    expect(calledFixed.calledAt).toBe("2026-08-20T01:00:00.000Z");

    const completed = emit.emitQueueCompleted({
      doctorId: fx.doctor.id,
      date: fx.date,
      session: "morning",
      queueNumber: 1,
      appointmentId: fx.booked.id,
    });
    expect(completed.appointmentId).toBe(fx.booked.id);

    const message = emit.emitChatMessage(fx.booked.id, { body: "halo" });
    expect(message.appointmentId).toBe(fx.booked.id);

    const typed = emit.emitChatTyping(
      fx.booked.id,
      { userId: fx.patient.id, isTyping: 1 },
      { exceptSocketId: "sock-1" }
    );
    expect(mocked.except).toHaveBeenCalledWith("sock-1");
    expect(mocked.exceptEmit).toHaveBeenCalledWith("chat:typing", typed);

    const typedAll = emit.emitChatTyping(fx.booked.id, { userId: fx.patient.id, isTyping: false });
    expect(mocked.emitFn).toHaveBeenCalledWith("chat:typing", typedAll);

    const read = emit.emitChatRead(fx.booked.id, {
      userId: fx.patient.id,
      lastReadAt: new Date().toISOString(),
    });
    expect(read.userId).toBe(fx.patient.id);
  });

  test("emit tidak melempar jika io belum di-set", async () => {
    emit.setIo(null);
    await expect(
      emit.emitQueueUpdated(fx.doctor.id, fx.date, "morning")
    ).resolves.toMatchObject({ doctorId: fx.doctor.id });
    expect(
      emit.emitChatTyping(fx.booked.id, { userId: fx.patient.id, isTyping: true })
    ).toMatchObject({ appointmentId: fx.booked.id });
    emit.setIo(Server.instance);
  });

  test("middleware socket menolak token kosong atau tidak valid", async () => {
    const io = Server.instance;
    const next = jest.fn();
    await io.middleware(
      { handshake: { headers: {}, auth: {} } },
      next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    await io.middleware(
      { handshake: { headers: { authorization: "Bearer" }, auth: {} } },
      next
    );

    await io.middleware(
      { handshake: { headers: {}, auth: { token: "bukan-jwt" } } },
      next
    );
    expect(next.mock.calls.some((args) => args[0] instanceof Error)).toBe(true);
  });

  test("middleware menerima token header dan menolak user hilang", async () => {
    const io = Server.instance;
    const socket = { handshake: { headers: { authorization: `Bearer ${fx.tokens.patient}` }, auth: {} } };
    const next = jest.fn();
    await io.middleware(socket, next);
    expect(next).toHaveBeenCalledWith();
    expect(socket.user.role).toBe("patient");

    const { signToken } = require("../helpers/jwt");
    const missing = signToken({ userId: 999999, role: "patient" });
    const nextMissing = jest.fn();
    await io.middleware(
      { handshake: { headers: {}, auth: { token: missing } } },
      nextMissing
    );
    expect(nextMissing.mock.calls[0][0].message).toMatch(/login/);
  });

  test("join, leave, dan typing", async () => {
    const io = Server.instance;
    const handlers = {};
    const socket = {
      id: "sock-1",
      user: { id: fx.patient.id, role: "patient", name: "Andi Pasien" },
      join: jest.fn(async () => {}),
      leave: jest.fn(async () => {}),
      on(event, fn) {
        handlers[event] = fn;
      },
    };
    io.handlers.connection(socket);

    const ack = jest.fn();
    await handlers.join(null, ack);
    expect(ack).toHaveBeenCalledWith({ ok: false, error: "Room wajib diisi" });

    await handlers.join("queue:not-valid", ack);
    expect(ack).toHaveBeenCalledWith({ ok: false, error: "Nama room tidak valid" });

    const queueRoom = `queue:${fx.doctor.id}:${fx.date}:morning`;
    await handlers.join({ room: queueRoom }, ack);
    expect(ack).toHaveBeenCalledWith({ ok: true, room: queueRoom });

    const forbiddenQueue = `queue:${fx.otherDoctor.id}:${fx.date}:afternoon`;
    await handlers.join(forbiddenQueue, ack);
    expect(ack).toHaveBeenCalledWith({
      ok: false,
      error: "Anda tidak dapat bergabung ke antrean ini",
    });

    await handlers.join(`chat:${fx.booked.id}`, ack);
    expect(ack).toHaveBeenCalledWith({
      ok: true,
      room: `chat:${fx.booked.id}`,
    });

    await handlers.join("chat:99999", ack);
    expect(ack).toHaveBeenCalledWith({
      ok: false,
      error: "Anda tidak dapat bergabung ke chat ini",
    });

    socket.join.mockRejectedValueOnce(new Error("join fail"));
    await handlers.join(queueRoom, ack);
    expect(ack).toHaveBeenCalledWith({ ok: false, error: "Gagal bergabung ke room" });
    await handlers.join(queueRoom);

    await handlers.leave(queueRoom, ack);
    expect(socket.leave).toHaveBeenCalledWith(queueRoom);
    await handlers.leave({ room: queueRoom }, ack);
    await handlers.leave({}, ack);

    await handlers["chat:typing"]();
    await handlers["chat:typing"]({ appointmentId: 0 });
    await handlers["chat:typing"]({ appointmentId: fx.completedPaid.id, isTyping: true });
    await handlers["chat:typing"]({
      appointmentId: fx.booked.id,
      isTyping: true,
    });

    const spy = jest.spyOn(db.Appointment, "findByPk").mockRejectedValueOnce(new Error("db"));
    await handlers["chat:typing"]({ appointmentId: fx.booked.id, isTyping: true });
    spy.mockRestore();
  });

  test("join room sebagai admin, dokter, dan role tidak dikenal", async () => {
    const io = Server.instance;
    const makeSocket = (user) => {
      const handlers = {};
      const socket = {
        id: "s",
        user,
        join: jest.fn(async () => {}),
        leave: jest.fn(async () => {}),
        on(event, fn) {
          handlers[event] = fn;
        },
        handlers,
      };
      io.handlers.connection(socket);
      return socket;
    };

    const adminAck = jest.fn();
    const adminSocket = makeSocket({ id: fx.admin.id, role: "admin" });
    await adminSocket.handlers.join(
      `queue:${fx.doctor.id}:${fx.date}:morning`,
      adminAck
    );
    expect(adminAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    await adminSocket.handlers.join(`chat:${fx.booked.id}`, adminAck);
    expect(adminAck).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false })
    );

    const doctorAck = jest.fn();
    const doctorSocket = makeSocket({ id: fx.doctorUser.id, role: "doctor" });
    await doctorSocket.handlers.join(
      `queue:${fx.doctor.id}:${fx.date}:morning`,
      doctorAck
    );
    expect(doctorAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    await doctorSocket.handlers.join(
      `queue:${fx.otherDoctor.id}:${fx.date}:morning`,
      doctorAck
    );
    expect(doctorAck).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
    await doctorSocket.handlers.join(`chat:${fx.booked.id}`, doctorAck);
    expect(doctorAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));

    const orphan = await db.User.create({
      name: "Dokter Tanpa Profil",
      email: "socket.orphan@test.com",
      passwordHash: hashPassword("password123"),
      phone: "081000000099",
      role: "doctor",
    });
    const orphanAck = jest.fn();
    const orphanSocket = makeSocket({ id: orphan.id, role: "doctor" });
    await orphanSocket.handlers.join(
      `queue:${fx.doctor.id}:${fx.date}:morning`,
      orphanAck
    );
    expect(orphanAck).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
    await orphanSocket.handlers.join(`chat:${fx.booked.id}`, orphanAck);

    const guestAck = jest.fn();
    const guestSocket = makeSocket({ id: 0, role: "guest" });
    await guestSocket.handlers.join(
      `queue:${fx.doctor.id}:${fx.date}:morning`,
      guestAck
    );
    expect(guestAck).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
    await guestSocket.handlers.join(`chat:${fx.booked.id}`, guestAck);
  });
});
