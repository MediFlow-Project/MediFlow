const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const { AdminScheduleController } = require("../../controllers/adminController");

router.use(authentication, requireAdmin);

router.get("/", AdminScheduleController.list);
router.post("/", AdminScheduleController.create);
router.put("/:id", AdminScheduleController.update);
router.delete("/:id", AdminScheduleController.destroy);

module.exports = router;
