const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requirePatient } = require("../middlewares/authorization");
const ChatbotController = require("../controllers/chatbotController");

// Salsa
router.post("/recommend", authentication, requirePatient, ChatbotController.recommend);

module.exports = router;
