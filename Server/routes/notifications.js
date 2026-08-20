const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { authorize } = require("../middlewares/authorization");
const { ROLES } = require("../helpers/constants");
const NotificationController = require("../controllers/notificationController");

router.get(
  "/",
  authentication,
  authorize(ROLES.PATIENT, ROLES.DOCTOR),
  NotificationController.list
);
router.post(
  "/read-all",
  authentication,
  authorize(ROLES.PATIENT, ROLES.DOCTOR),
  NotificationController.markAllRead
);
router.post(
  "/:id/read",
  authentication,
  authorize(ROLES.PATIENT, ROLES.DOCTOR),
  NotificationController.markRead
);

module.exports = router;
