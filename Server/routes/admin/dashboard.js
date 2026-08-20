const router = require("express").Router();
const authentication = require("../../middlewares/authentication");
const { requireAdmin } = require("../../middlewares/authorization");
const DashboardController = require("../../controllers/dashboardController");

// Salsa
router.get("/", authentication, requireAdmin, DashboardController.show);

module.exports = router;
