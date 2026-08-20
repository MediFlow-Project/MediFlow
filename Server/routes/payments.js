const router = require("express").Router();
const PaymentController = require("../controllers/paymentController");

// Salsa — webhook Midtrans, TANPA JWT user
router.post("/midtrans/notification", PaymentController.notification);

module.exports = router;
