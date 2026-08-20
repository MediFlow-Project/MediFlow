const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const InvoiceController = require("../../controllers/invoiceController");

// Salsa — GET /
router.get("/", authentication, requireAdmin, InvoiceController.adminList);

module.exports = router;
