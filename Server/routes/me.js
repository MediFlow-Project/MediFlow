const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const AuthController = require("../controllers/authController");

router.get("/", authentication, AuthController.me);

module.exports = router;
