const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requirePatient, authorize } = require("../middlewares/authorization");
const { ROLES } = require("../helpers/constants");
const AppointmentController = require("../controllers/appointmentController");
const ChatController = require("../controllers/chatController");

const chatUsers = authorize(ROLES.PATIENT, ROLES.DOCTOR);

router.post("/", authentication, requirePatient, AppointmentController.create);
router.get("/", authentication, AppointmentController.list);
router.get("/:id/messages", authentication, chatUsers, ChatController.listMessages);
router.post("/:id/messages", authentication, chatUsers, ChatController.createMessage);
router.post("/:id/messages/read", authentication, chatUsers, ChatController.markRead);
router.patch("/:id/cancel", authentication, AppointmentController.cancel);
router.get("/:id", authentication, AppointmentController.detail);

module.exports = router;
