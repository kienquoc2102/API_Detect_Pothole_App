const router = require("express").Router();
const authController = require("../controllers/authController");
const middlewareController = require("../controllers/middlewareController");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/sendPin", authController.sendResetPin);
router.post("/resetPassword", authController.verifyPinAndResetPassword);
router.put("/updateUser/:id",middlewareController.verifyToken, authController.updateUser);
router.post("/checkPassword/:id",middlewareController.verifyToken, authController.checkCurrentPassword);
router.put("/newPassword/:id", middlewareController.verifyToken,authController.createNewPassword);
router.post("/googleLogin", authController.googleLogin);

module.exports = router;