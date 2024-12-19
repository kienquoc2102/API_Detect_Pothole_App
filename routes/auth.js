const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/sendPin", authController.sendResetPin);
router.post("/resetPassword", authController.verifyPinAndResetPassword);
router.post("/googleLogin", authController.googleLogin);

module.exports = router;