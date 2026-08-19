const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requirePatient } = require("../middlewares/authorization");
const chatbotController = require("../controllers/chatbotController");

// Salsa
router.post("/recommend", authentication, requirePatient, chatbotController.recommend);

module.exports = router;
