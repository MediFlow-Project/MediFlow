const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requirePatient } = require("../middlewares/authorization");
const InvoiceController = require("../controllers/invoiceController");

// Salsa
router.get("/", authentication, requirePatient, InvoiceController.list);
router.get("/:id", authentication, InvoiceController.detail);
router.post("/:id/pay", authentication, requirePatient, InvoiceController.pay);

module.exports = router;
