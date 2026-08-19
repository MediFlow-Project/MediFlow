const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/me", require("./me"));
router.use("/specialties", require("./specialties"));
router.use("/doctors", require("./doctors"));
router.use("/appointments", require("./appointments"));
router.use("/queues", require("./queues"));
router.use("/doctor", require("./doctor"));
router.use("/invoices", require("./invoices"));
router.use("/payments", require("./payments"));
router.use("/chatbot", require("./chatbot"));
router.use("/chats", require("./chats"));
router.use("/admin", require("./admin"));

module.exports = router;
