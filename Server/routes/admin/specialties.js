const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { imageUpload } = require("../../helpers/imageUpload");
const { AdminSpecialtyController } = require("../../controllers/adminController");

router.use(authentication, requireAdmin);

router.get("/", AdminSpecialtyController.list);
router.post("/", imageUpload.single("file"), AdminSpecialtyController.create);
router.put("/:id", imageUpload.single("file"), AdminSpecialtyController.update);
router.delete("/:id", AdminSpecialtyController.destroy);

module.exports = router;
