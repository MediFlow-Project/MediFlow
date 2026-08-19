const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requirePatient } = require("../middlewares/authorization");
const invoiceController = require("../controllers/invoiceController");

// Salsa
router.get("/:id", authentication, invoiceController.detail);
router.post("/:id/pay", authentication, requirePatient, invoiceController.pay);

module.exports = router;
