const router = require("express").Router();
const controller = require("../controllers/Otp");

router.post("/verify-firebase-phone", controller.verifyFirebasePhone);

module.exports = router;
