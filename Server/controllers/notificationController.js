const { Notification } = require("../models");
const { serializeNotification } = require("../helpers/notify");
const HttpError = require("../helpers/HttpError");

class NotificationController {
  static async list(req, res, next) {
    try {
      const items = await Notification.findAll({
        where: { userId: req.user.id },
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        limit: 50,
      });
      const unreadCount = await Notification.count({
        where: { userId: req.user.id, readAt: null },
      });
      res.json({
        items: items.map(serializeNotification),
        unreadCount,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req, res, next) {
    try {
      const item = await Notification.findByPk(req.params.id);
      if (!item || item.userId !== req.user.id) {
        throw new HttpError(404, "Notifikasi tidak ditemukan");
      }
      if (!item.readAt) {
        await item.update({ readAt: new Date() });
      }
      res.json(serializeNotification(item));
    } catch (err) {
      next(err);
    }
  }

  static async markAllRead(req, res, next) {
    try {
      const readAt = new Date();
      await Notification.update(
        { readAt },
        { where: { userId: req.user.id, readAt: null } }
      );
      res.json({ ok: true, readAt });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
