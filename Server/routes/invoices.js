const router = require("express").Router();
const invoiceController = require("../controllers/invoiceController");
const { requireAuth, requireRole } = require("../middlewares/salsaAuth");

// Salsa
router.get("/:id", requireAuth, invoiceController.detail);
router.post("/:id/pay", requireAuth, requireRole("patient"), invoiceController.pay);

module.exports = router;
