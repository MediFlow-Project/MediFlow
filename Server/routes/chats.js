const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { authorize } = require("../middlewares/authorization");
const { ROLES } = require("../helpers/constants");
const ChatController = require("../controllers/chatController");

// Salsa — inbox chat
router.get(
  "/",
  authentication,
  authorize(ROLES.PATIENT, ROLES.DOCTOR),
  ChatController.inbox
);

module.exports = router;
