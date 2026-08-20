const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { imageUpload } = require("../../helpers/imageUpload");
const { AdminDoctorController } = require("../../controllers/adminController");

router.use(authentication, requireAdmin);

router.get("/", AdminDoctorController.list);
router.post("/", imageUpload.single("file"), AdminDoctorController.create);
router.put("/:id", imageUpload.single("file"), AdminDoctorController.update);
router.delete("/:id", AdminDoctorController.destroy);

module.exports = router;
