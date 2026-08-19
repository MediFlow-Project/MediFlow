const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { authorize } = require("../middlewares/authorization");
const { ROLES } = require("../helpers/constants");
const chatController = require("../controllers/chatController");

const chatUsers = authorize(ROLES.PATIENT, ROLES.DOCTOR);

// Salsa — thread chat per appointment
router.get("/:id/messages", authentication, chatUsers, chatController.listMessages);
router.post("/:id/messages", authentication, chatUsers, chatController.createMessage);
router.post("/:id/messages/read", authentication, chatUsers, chatController.markRead);

module.exports = router;
