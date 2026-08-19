const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { AdminAppointmentController } = require("../../controllers/adminController");

router.use(authentication, requireAdmin);

router.get("/", AdminAppointmentController.list);

module.exports = router;
