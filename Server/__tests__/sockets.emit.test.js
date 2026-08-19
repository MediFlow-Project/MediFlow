jest.mock("../helpers/queuePayload", () => ({
  buildQueuePayload: jest.fn().mockResolvedValue({
    doctorId: 1,
    date: "2026-08-20",
    session: "morning",
    nowServing: 1,
    items: [],
  }),
}));

const {
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
} = require("../sockets/emit");

function fakeIo() {
  const emit = jest.fn();
  const exceptEmit = jest.fn();
  const except = jest.fn().mockReturnValue({ emit: exceptEmit });
  const to = jest.fn().mockReturnValue({ emit, except });
  return { io: { to }, emit, except, exceptEmit };
}

describe("socket emit helpers", () => {
  it("builds room names", () => {
    expect(queueRoom(1, "2026-08-20", "morning")).toBe("queue:1:2026-08-20:morning");
    expect(chatRoom(9)).toBe("chat:9");
  });

  it("no-ops without io", async () => {
    setIo(null);
    expect(getIo()).toBeNull();
    await emitQueueUpdated(1, "2026-08-20", "morning");
    emitQueueCalled({ doctorId: 1, date: "2026-08-20", session: "morning", queueNumber: 2, appointmentId: 3 });
    emitQueueCompleted({ doctorId: 1, date: "2026-08-20", session: "morning", queueNumber: 2, appointmentId: 3 });
    emitChatMessage(1, { id: 1 });
    emitChatTyping(1, { userId: 2, isTyping: true });
    emitChatRead(1, { userId: 2, lastReadAt: "t" });
  });

  it("emits to rooms", async () => {
    const { io, emit, except, exceptEmit } = fakeIo();
    setIo(io);
    await emitQueueUpdated(1, "2026-08-20", "morning");
    emitQueueCalled({ doctorId: 1, date: "2026-08-20", session: "morning", queueNumber: 2, appointmentId: 3 });
    emitQueueCompleted({ doctorId: 1, date: "2026-08-20", session: "morning", queueNumber: 2, appointmentId: 3 });
    emitChatMessage(4, { id: 10, body: "hi" });
    emitChatRead(4, { userId: 2, lastReadAt: "t" });
    emitChatTyping(4, { userId: 2, isTyping: true });
    emitChatTyping(4, { userId: 2, isTyping: false }, { exceptSocketId: "abc" });
    expect(emit).toHaveBeenCalled();
    expect(except).toHaveBeenCalledWith("abc");
    expect(exceptEmit).toHaveBeenCalled();
    setIo(null);
  });
});
