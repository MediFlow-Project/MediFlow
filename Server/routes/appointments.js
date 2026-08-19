const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requirePatient } = require("../middlewares/authorization");
const AppointmentController = require("../controllers/appointmentController");

router.post("/", authentication, requirePatient, AppointmentController.create);
router.get("/", authentication, AppointmentController.list);
router.get("/:id", authentication, AppointmentController.detail);
router.patch("/:id/cancel", authentication, AppointmentController.cancel);

module.exports = router;
