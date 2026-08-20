const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const AuthController = require("../controllers/authController");

router.get("/", authentication, AuthController.me);
router.patch("/", authentication, AuthController.updateMe);

module.exports = router;
