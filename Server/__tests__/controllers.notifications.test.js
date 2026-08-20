jest.mock("../models", () => require("./utils").createModelsMock());

const { Notification } = require("../models");
const NotificationController = require("../controllers/notificationController");
const { mockRes, mockNext } = require("./utils");

function req(overrides = {}) {
  return {
    user: { id: 10, role: "patient" },
    params: {},
    ...overrides,
  };
}

describe("NotificationController", () => {
  it("lists items and unread count", async () => {
    const item = {
      id: 1,
      userId: 10,
      type: "queue_called",
      title: "Giliran Anda",
      message: "Nomor 01 dipanggil.",
      href: "/saya/antrean/3",
      appointmentId: 3,
      invoiceId: null,
      readAt: null,
      createdAt: "t",
      toJSON() {
        return this;
      },
    };
    Notification.findAll.mockResolvedValue([item]);
    Notification.count.mockResolvedValue(1);
    const res = mockRes();
    await NotificationController.list(req(), res, mockNext());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ unreadCount: 1, items: [expect.objectContaining({ id: 1 })] })
    );
  });

  it("marks one and all as read", async () => {
    const item = {
      id: 2,
      userId: 10,
      readAt: null,
      update: jest.fn(async function update(fields) {
        Object.assign(this, fields);
      }),
      toJSON() {
        return this;
      },
    };
    Notification.findByPk.mockResolvedValue(item);
    const res = mockRes();
    await NotificationController.markRead(req({ params: { id: 2 } }), res, mockNext());
    expect(item.update).toHaveBeenCalled();

    const next = mockNext();
    Notification.findByPk.mockResolvedValue({ id: 9, userId: 99 });
    await NotificationController.markRead(req({ params: { id: 9 } }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(404);

    Notification.update.mockResolvedValue([3]);
    const resAll = mockRes();
    await NotificationController.markAllRead(req(), resAll, mockNext());
    expect(resAll.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });
});
