const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const dashboardController = require("../../controllers/dashboardController");

// Salsa
router.get("/", authentication, requireAdmin, dashboardController.show);

module.exports = router;
