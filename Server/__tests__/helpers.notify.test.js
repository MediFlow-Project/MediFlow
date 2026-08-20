jest.mock("../models", () => require("./utils").createModelsMock());
jest.mock("../sockets/emit", () => ({
  emitNotification: jest.fn(),
}));

const { Notification } = require("../models");
const { emitNotification } = require("../sockets/emit");
const {
  serializeNotification,
  createNotification,
  notifyQueueCalled,
  notifyQueueSkipped,
  notifySessionOpened,
  notifyBookingCreated,
  notifyAppointmentCancelled,
  notifyInvoiceCreated,
  notifyInvoiceStatusChange,
} = require("../helpers/notify");
const { NOTIFICATION_TYPES } = require("../helpers/constants");

function row(overrides = {}) {
  const data = {
    id: 1,
    userId: 10,
    type: NOTIFICATION_TYPES.QUEUE_CALLED,
    title: "Giliran Anda",
    message: "Nomor 01 dipanggil.",
    href: "/saya/antrean/3",
    appointmentId: 3,
    invoiceId: null,
    readAt: null,
    createdAt: "2026-08-20T10:00:00.000Z",
    ...overrides,
  };
  return { ...data, toJSON: () => data };
}

describe("notify helper", () => {
  beforeEach(() => {
    Notification.create.mockReset();
    Notification.findOne.mockReset();
    emitNotification.mockReset();
    Notification.create.mockImplementation(async (fields) => row(fields));
  });

  it("serializes plain objects", () => {
    expect(serializeNotification({ userId: "4", type: "x", title: "t", message: "m" })).toMatchObject({
      userId: 4,
      type: "x",
    });
  });

  it("creates and emits a notification", async () => {
    const payload = await createNotification({
      userId: 10,
      type: NOTIFICATION_TYPES.QUEUE_CALLED,
      title: "Giliran Anda",
      message: "Nomor 02 dipanggil.",
      href: "/saya/antrean/5",
      appointmentId: 5,
    });
    expect(payload.type).toBe("queue_called");
    expect(emitNotification).toHaveBeenCalled();
  });

  it("notifies queue called and skipped", async () => {
    await notifyQueueCalled({ id: 8, patientId: 10, queueNumber: 3 });
    await notifyQueueSkipped({ id: 8, patientId: 10, queueNumber: 3 });
    expect(Notification.create).toHaveBeenCalledTimes(2);
  });

  it("notifies opened sessions and booking", async () => {
    await notifySessionOpened([
      { id: 1, patientId: 10, date: "2026-08-20", session: "morning" },
      { id: 2 },
    ]);
    await notifyBookingCreated({
      id: 4,
      date: "2026-08-20",
      session: "afternoon",
      queueNumber: 2,
      Doctor: { userId: 20 },
      Patient: { name: "Budi" },
    });
    expect(Notification.create).toHaveBeenCalled();
  });

  it("notifies cancel to the other party", async () => {
    const appointment = {
      id: 4,
      patientId: 10,
      date: "2026-08-20",
      session: "morning",
      Doctor: { userId: 20 },
      Patient: { name: "Budi" },
    };
    await notifyAppointmentCancelled(appointment, { id: 10, role: "patient" });
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 20, type: "appointment_cancelled" })
    );
  });

  it("notifies invoice created and status without duplicates", async () => {
    await notifyInvoiceCreated({ id: 4, patientId: 10 }, { id: 9, amount: 150000 });
    Notification.findOne.mockResolvedValue(row({ type: "invoice_paid", invoiceId: 9 }));
    const existing = await notifyInvoiceStatusChange(
      { id: 9, status: "paid", amount: 150000, appointmentId: 4 },
      { id: 4, patientId: 10 }
    );
    expect(existing.type).toBe("invoice_paid");
    Notification.findOne.mockResolvedValue(null);
    await notifyInvoiceStatusChange(
      { id: 9, status: "expire", amount: 150000, appointmentId: 4 },
      { id: 4, patientId: 10 }
    );
    expect(Notification.create).toHaveBeenCalled();
  });

  it("swallows create errors", async () => {
    Notification.create.mockRejectedValue(new Error("db"));
    await expect(
      createNotification({
        userId: 1,
        type: "x",
        title: "t",
        message: "m",
      })
    ).resolves.toBeNull();
  });
});
