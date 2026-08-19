const router = require("express").Router();
const paymentController = require("../controllers/paymentController");

// Salsa — webhook Midtrans, TANPA JWT user
router.post("/midtrans/notification", paymentController.notification);

module.exports = router;
