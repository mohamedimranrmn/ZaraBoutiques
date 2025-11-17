// backend/routes/Order.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/Order");

// Invoice download
router.get("/:id/invoice", orderController.downloadInvoice);

// Core Order Routes
router.post("/", orderController.create);
router.get("/", orderController.getAll);
router.get("/user/:id", orderController.getByUserId);
router.patch("/:id", orderController.updateById);

// Razorpay
router.post("/razorpay/create", orderController.createRazorpayOrder);
router.post("/razorpay/verify", orderController.verifyRazorpayPayment);

module.exports = router;
