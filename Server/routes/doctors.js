const router = require("express").Router();
const DoctorController = require("../controllers/doctorController");

router.get("/", DoctorController.list);
router.get("/:id", DoctorController.detail);

module.exports = router;
