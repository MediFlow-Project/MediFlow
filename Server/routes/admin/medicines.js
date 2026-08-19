const router = require("express").Router();
const medicineController = require("../../controllers/medicineController");
const { requireAuth, requireRole } = require("../../middlewares/salsaAuth");

// Salsa — CRUD katalog obat
// GET: admin & doctor (dokter perlu baca katalog untuk resep)
// tulis: admin saja

router.get("/", requireAuth, requireRole("admin", "doctor"), medicineController.list);
router.get("/:id", requireAuth, requireRole("admin", "doctor"), medicineController.detail);
router.post("/", requireAuth, requireRole("admin"), medicineController.create);
router.put("/:id", requireAuth, requireRole("admin"), medicineController.update);
router.delete("/:id", requireAuth, requireRole("admin"), medicineController.destroy);

module.exports = router;
