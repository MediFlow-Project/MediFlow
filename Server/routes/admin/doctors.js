const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { AdminDoctorController } = require("../../controllers/adminController");

router.use(authentication, requireAdmin);

router.get("/", AdminDoctorController.list);
router.post("/", AdminDoctorController.create);
router.put("/:id", AdminDoctorController.update);
router.delete("/:id", AdminDoctorController.destroy);

module.exports = router;
