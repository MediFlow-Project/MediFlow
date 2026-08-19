const router = require("express").Router();
const chatbotController = require("../controllers/chatbotController");
const { requireAuth, requireRole } = require("../middlewares/salsaAuth");

// Salsa
router.post("/recommend", requireAuth, requireRole("patient"), chatbotController.recommend);

module.exports = router;
