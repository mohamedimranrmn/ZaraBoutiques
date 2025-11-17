const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Order = require("../models/Order");

router.post("/create-order", async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;

        const options = {
            amount: amount * 100,
            currency,
            receipt: `rcpt_${Date.now()}`
        };

        const rzpOrder = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            orderId: rzpOrder.id,
            amount: options.amount,
            currency,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "Failed to create Razorpay order" });
    }
});

router.post("/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            mongoOrderId
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid signature!" });
        }

        await Order.findByIdAndUpdate(mongoOrderId, {
            paymentId: razorpay_payment_id,
            orderIdGateway: razorpay_order_id,
            paymentSignature: razorpay_signature,
            paymentStatus: "PAID",
            paymentCapturedAt: new Date()
        });

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
