const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const invoiceController = require("../../controllers/invoiceController");

// Salsa — GET /
router.get("/", authentication, requireAdmin, invoiceController.adminList);

module.exports = router;
