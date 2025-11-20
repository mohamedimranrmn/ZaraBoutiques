// backend/routes/Order.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/Order");

router.post("/razorpay/create", orderController.createRazorpayOrder);
router.post("/razorpay/verify", orderController.verifyRazorpayPayment);

router.get("/user/:id", orderController.getByUserId);

router.get("/", orderController.getAll);

router.get("/:id/invoice", orderController.downloadInvoice);

router.post("/", orderController.create);

router.patch("/:id", orderController.updateById);

module.exports = router;
