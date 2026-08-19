const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requireDoctor } = require("../middlewares/authorization");
const consultationController = require("../controllers/consultationController");

// Salsa
router.post(
  "/consultations/complete",
  authentication,
  requireDoctor,
  consultationController.complete
);

module.exports = router;
