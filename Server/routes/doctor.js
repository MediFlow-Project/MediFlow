const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requireDoctor } = require("../middlewares/authorization");
const QueueController = require("../controllers/queueController");

router.use(authentication, requireDoctor);

router.get("/sessions/today", QueueController.sessionsToday);
router.post("/sessions/open", QueueController.openSession);
router.get("/queues", QueueController.doctorBoard);
router.post("/queues/call", QueueController.callNext);
router.post("/queues/skip", QueueController.skip);
router.post("/consultations/start", QueueController.startConsult);

module.exports = router;
