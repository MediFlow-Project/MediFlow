const router = require("express").Router();

router.use("/specialties", require("./specialties"));
router.use("/doctors", require("./doctors"));
router.use("/schedules", require("./schedules"));
router.use("/appointments", require("./appointments"));
router.use("/medicines", require("./medicines"));
router.use("/invoices", require("./invoices"));
router.use("/dashboard", require("./dashboard"));

module.exports = router;
