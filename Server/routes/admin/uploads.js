const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { imageUpload } = require("../../helpers/imageUpload");
const UploadController = require("../../controllers/uploadController");

router.use(authentication, requireAdmin);
router.post("/", imageUpload.single("file"), UploadController.create);

module.exports = router;
