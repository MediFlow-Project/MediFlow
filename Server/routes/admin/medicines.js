const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin, authorize } = require("../../middlewares/authorization");
const { ROLES } = require("../../helpers/constants");
const MedicineController = require("../../controllers/medicineController");
const { imageUpload } = require("../../helpers/imageUpload");

// Salsa — CRUD katalog obat
router.get("/", authentication, authorize(ROLES.ADMIN, ROLES.DOCTOR), MedicineController.list);
router.get("/:id", authentication, authorize(ROLES.ADMIN, ROLES.DOCTOR), MedicineController.detail);
router.post("/", authentication, requireAdmin, imageUpload.single("file"), MedicineController.create);
router.put("/:id", authentication, requireAdmin, imageUpload.single("file"), MedicineController.update);
router.delete("/:id", authentication, requireAdmin, MedicineController.destroy);

module.exports = router;
