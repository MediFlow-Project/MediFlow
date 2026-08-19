const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin, authorize } = require("../../middlewares/authorization");
const { ROLES } = require("../../helpers/constants");
const medicineController = require("../../controllers/medicineController");

// Salsa — CRUD katalog obat
router.get("/", authentication, authorize(ROLES.ADMIN, ROLES.DOCTOR), medicineController.list);
router.get("/:id", authentication, authorize(ROLES.ADMIN, ROLES.DOCTOR), medicineController.detail);
router.post("/", authentication, requireAdmin, medicineController.create);
router.put("/:id", authentication, requireAdmin, medicineController.update);
router.delete("/:id", authentication, requireAdmin, medicineController.destroy);

module.exports = router;
