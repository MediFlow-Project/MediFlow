const router = require("express").Router();
const SpecialtyController = require("../controllers/specialtyController");

router.get("/", SpecialtyController.list);
router.get("/:id", SpecialtyController.detail);

module.exports = router;
