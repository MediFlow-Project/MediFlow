const router = require("express").Router();
const AuthController = require("../controllers/authController");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);

module.exports = router;
