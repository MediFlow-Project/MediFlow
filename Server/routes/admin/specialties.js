const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { AdminSpecialtyController } = require("../../controllers/adminController");

router.use(authentication, requireAdmin);

router.get("/", AdminSpecialtyController.list);
router.post("/", AdminSpecialtyController.create);
router.put("/:id", AdminSpecialtyController.update);
router.delete("/:id", AdminSpecialtyController.destroy);

module.exports = router;
