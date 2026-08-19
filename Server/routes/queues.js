const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const QueueController = require("../controllers/queueController");

router.get("/:doctorId", authentication, QueueController.publicBoard);

module.exports = router;
