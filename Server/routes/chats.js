const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { authorize } = require("../middlewares/authorization");
const { ROLES } = require("../helpers/constants");
const chatController = require("../controllers/chatController");

// Salsa — inbox chat
router.get(
  "/",
  authentication,
  authorize(ROLES.PATIENT, ROLES.DOCTOR),
  chatController.inbox
);

module.exports = router;
