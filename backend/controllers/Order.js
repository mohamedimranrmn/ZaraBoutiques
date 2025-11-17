// backend/controllers/Order.js

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const admin = require("../firebase/admin"); // Firebase admin

/* ============================================================
   RAZORPAY INSTANCE
   ============================================================ */
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn("⚠️ Razorpay keys missing – payment routes will fail.");
}

/* ============================================================
   HELPERS
   ============================================================ */

const normalizeItem = (it) => {
    const raw = it.toObject ? it.toObject() : it;
    const p = raw.product || {};

    const images = Array.isArray(p.images) && p.images.length
        ? p.images
        : [p.thumbnail || ""];

    const brandName = typeof p.brand === "object"
        ? p.brand.name
        : p.brand || "";

    return {
        ...raw,
        product: {
            _id: p._id,
            title: p.title,
            images,
            thumbnail: p.thumbnail || images[0],
            brand: { name: brandName },
            description: p.description,
            price: p.price ?? raw.priceAtPurchase ?? 0,
        },
        quantity: raw.quantity,
        size: raw.size || null,
        priceAtPurchase: raw.priceAtPurchase ?? p.price
    };
};

const buildSnapshot = (p, qty, size = null) => ({
    product: {
        _id: p._id,
        title: p.title,
        images: p.images || [],
        thumbnail: p.thumbnail,
        brand: p.brand ? { _id: p.brand._id, name: p.brand.name } : { name: "" },
        description: p.description,
        price: p.price
    },
    quantity: qty,
    size: size || null,
    priceAtPurchase: p.price,
    sku: p.sku,
    weight: p.weight,
    brandName: p.brand ? p.brand.name : undefined,
    categoryName: p.categoryName
});

const decrementStock = async (items) => {
    for (const it of items) {
        const id = it.product._id;
        const qty = it.quantity;

        const updated = await Product.updateOne(
            { _id: id, stockQuantity: { $gte: qty } },
            { $inc: { stockQuantity: -qty } }
        );

        if (!updated.modifiedCount) {
            throw new Error(`Insufficient stock for ${it.product.title}`);
        }
    }
};

/* ============================================================
   DOWNLOAD INVOICE (already correct)
   ============================================================ */
exports.downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Invoice_${orderId}.pdf`
        );

        const doc = new PDFDocument({
            margin: 50,
            size: "A4"
        });

        doc.pipe(res);

        // PDF content unchanged (omitted for brevity)
        // ---------------------------------------------------
        // YOU KEEP ALL YOUR EXISTING INVOICE GENERATION CODE
        // ---------------------------------------------------

        doc.end();
    } catch (err) {
        console.error("Invoice error:", err);
        res.status(500).json({ message: "Error generating invoice" });
    }
};

/* ============================================================
   1. CREATE COD ORDER (unchanged)
   ============================================================ */
exports.create = async (req, res) => {
    try {
        const { user, item, address, paymentMode, total } = req.body;

        if (!user || !item || !item.length) {
            return res.status(400).json({ message: "Invalid payload" });
        }
        if (!paymentMode || paymentMode.toUpperCase() !== "COD") {
            return res.status(400).json({ message: "Use Razorpay endpoints for online payments" });
        }

        const userDoc = await User.findById(user);
        const userName = userDoc?.name || userDoc?.username || "Unknown";
        const userEmail = userDoc?.email || "N/A";

        const snapshots = [];

        for (const it of item) {
            const p = await Product.findById(it.product._id).populate("brand");
            if (!p) {
                return res.status(400).json({ message: "Product not found" });
            }

            const updated = await Product.updateOne(
                { _id: p._id, stockQuantity: { $gte: it.quantity } },
                { $inc: { stockQuantity: -it.quantity } }
            );

            if (!updated.modifiedCount) {
                return res.status(400).json({
                    message: `Insufficient stock for ${p.title}`
                });
            }

            snapshots.push(buildSnapshot(p, it.quantity, it.size || null));
        }

        const order = await Order.create({
            user,
            userName,
            userEmail,
            item: snapshots,
            address: [address],
            total,
            status: "Pending",
            subtotal: req.body.subtotal,
            shippingCharge: req.body.shippingCharge,
            taxAmount: req.body.taxAmount,
            discount: req.body.discount,
            couponCode: req.body.couponCode,
            finalAmount: req.body.finalAmount ?? total,
            paymentMode: "COD",
            paymentStatus: "PENDING"
        });

        res.status(201).json({
            ...order.toObject(),
            item: order.item.map(normalizeItem)
        });
    } catch (err) {
        console.error("COD Order error:", err);
        res.status(500).json({ message: "Error placing COD order" });
    }
};

/* ============================================================
   2. CREATE RAZORPAY ORDER (Firebase phone verification)
   ============================================================ */
exports.createRazorpayOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({ message: "Razorpay not configured" });
        }

        const { user, item, address, finalAmount } = req.body;

        if (!user || !item || !item.length || !finalAmount) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        /* -----------------------------
           FIREBASE PHONE VERIFICATION
        ----------------------------- */
        if (req.body.firebasePhoneToken) {
            try {
                const decoded = await admin.auth().verifyIdToken(req.body.firebasePhoneToken);

                const firebasePhone = decoded.phone_number?.replace("+91", "");
                const addr = Array.isArray(address) ? address[0] : address;

                if (addr.phoneNumber.slice(-10) !== firebasePhone) {
                    return res.status(400).json({
                        message: "Verified phone does not match the address phone number."
                    });
                }
            } catch (err) {
                console.error("Firebase OTP verification error:", err);
                return res.status(400).json({ message: "Invalid Firebase token" });
            }
        }

        /* -----------------------------
           USER DETAILS
        ----------------------------- */
        const userDoc = await User.findById(user);
        const userName = userDoc?.name || userDoc?.username || "Unknown";
        const userEmail = userDoc?.email || "N/A";

        /* -----------------------------
           ITEM SNAPSHOTS + STOCK CHECK
        ----------------------------- */
        const snapshots = [];

        for (const it of item) {
            const p = await Product.findById(it.product._id).populate("brand");
            if (!p) return res.status(400).json({ message: "Product not found" });

            if (p.stockQuantity < it.quantity) {
                return res.status(400).json({
                    message: `Only ${p.stockQuantity} left for ${p.title}`
                });
            }

            snapshots.push(buildSnapshot(p, it.quantity, it.size || null));
        }

        /* -----------------------------
           CREATE RAZORPAY ORDER
        ----------------------------- */
        const rpOrder = await razorpay.orders.create({
            amount: Math.round(finalAmount * 100),
            currency: "INR",
            receipt: `zb_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        });

        /* -----------------------------
           CREATE ORDER IN DB
        ----------------------------- */
        const order = await Order.create({
            user,
            userName,
            userEmail,
            item: snapshots,
            address: [address],
            total: finalAmount,
            status: "Pending",
            subtotal: req.body.subtotal,
            shippingCharge: req.body.shippingCharge,
            taxAmount: req.body.taxAmount,
            discount: req.body.discount,
            couponCode: req.body.couponCode,
            finalAmount,
            paymentMode: "RAZORPAY",
            paymentStatus: "PENDING",
            orderIdGateway: rpOrder.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"]
        });

        res.status(201).json({
            orderId: order._id.toString(),
            razorpayOrderId: rpOrder.id,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error("Razorpay Order error:", err);
        res.status(500).json({ message: "Error creating Razorpay order" });
    }
};

/* ============================================================
   3. VERIFY RAZORPAY PAYMENT
   ============================================================ */
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (expected !== razorpay_signature) {
            order.paymentStatus = "FAILED";
            await order.save();
            return res.status(400).json({ message: "Invalid signature" });
        }

        await decrementStock(order.item);

        order.paymentStatus = "PAID";
        order.paymentId = razorpay_payment_id;
        order.paymentSignature = razorpay_signature;
        order.paymentMethod = "RAZORPAY";
        order.paymentCapturedAt = new Date();

        await order.save();

        res.status(200).json({
            ...order.toObject(),
            item: order.item.map(normalizeItem)
        });
    } catch (err) {
        console.error("Payment verification error:", err);
        res.status(500).json({ message: "Error verifying payment" });
    }
};

/* ============================================================
   4. GET USER ORDERS
   ============================================================ */
exports.getByUserId = async (req, res) => {
    try {
        const results = await Order.find({ user: req.params.id });
        res.status(200).json(
            results.map((o) => ({
                ...o.toObject(),
                item: o.item.map(normalizeItem)
            }))
        );
    } catch (err) {
        console.error("Get user orders error:", err);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

/* ============================================================
   5. ADMIN – GET ALL
   ============================================================ */
exports.getAll = async (req, res) => {
    try {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);

        const skip = page && limit ? (page - 1) * limit : 0;

        const total = await Order.countDocuments();
        const orders = await Order.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.header("X-Total-Count", total);
        res.status(200).json(
            orders.map((o) => ({
                ...o.toObject(),
                item: o.item.map(normalizeItem)
            }))
        );
    } catch (err) {
        console.error("Get all orders error:", err);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

/* ============================================================
   6. ADMIN – UPDATE ORDER
   ============================================================ */
exports.updateById = async (req, res) => {
    try {
        const id = req.params.id;

        if (req.body.status === "Cancelled") {
            const old = await Order.findById(id);
            if (old) {
                for (const it of old.item) {
                    await Product.findByIdAndUpdate(it.product._id, {
                        $inc: { stockQuantity: it.quantity }
                    });
                }
            }
        }

        const updated = await Order.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Not found" });

        res.status(200).json({
            ...updated.toObject(),
            item: updated.item.map(normalizeItem)
        });
    } catch (err) {
        console.error("Update order error:", err);
        res.status(500).json({ message: "Error updating order" });
    }
};
