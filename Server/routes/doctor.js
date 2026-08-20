const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const { requireDoctor } = require("../middlewares/authorization");
const QueueController = require("../controllers/queueController");
const ConsultationController = require("../controllers/consultationController");

router.use(authentication, requireDoctor);

router.get("/sessions/today", QueueController.sessionsToday);
router.post("/sessions/open", QueueController.openSession);
router.get("/queues", QueueController.doctorBoard);
router.post("/queues/call", QueueController.callNext);
router.post("/queues/skip", QueueController.skip);
router.post("/consultations/start", QueueController.startConsult);
router.post("/consultations/complete", ConsultationController.complete);

module.exports = router;
