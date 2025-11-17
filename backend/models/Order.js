// backend/models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// ✅ FIXED: Added size field to orderItemSchema
const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.Mixed,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    priceAtPurchase: {
        type: Number,
        required: true
    },
    // ✅ SIZE FIELD - CRITICAL FOR CLOTHING/FOOTWEAR
    size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '6', '7', '8', '9', '10', '11', '12', 'One Size', null],
        default: null
    },
    // extra optional metadata for analytics / returns / shipping
    sku: String,
    weight: Number,
    brandName: String,
    categoryName: String
}, { _id: false });

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // snapshot of user at the time of order
    userEmail: String,
    userName: String,

    item: {
        type: [orderItemSchema],
        required: true
    },

    // KEEP SAME SHAPE AS BEFORE: array with [0] used in frontend
    address: {
        type: Schema.Types.Mixed,
        required: true
    },

    // DELIVERY STATUS – keep same name to avoid breaking AdminOrders
    status: {
        type: String,
        enum: ['Pending', 'Dispatched', 'Out for delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },

    // Original field your UI already uses
    total: {
        type: Number,
        required: true
    },

    // Extra breakdown for future: optional now
    subtotal: Number,
    shippingCharge: Number,
    taxAmount: Number,
    discount: Number,
    couponCode: String,
    finalAmount: Number,   // usually == total, but kept separate

    // Payment mode & status
    paymentMode: {
        type: String,
        enum: ['COD', 'RAZORPAY'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },

    // Razorpay specific fields
    paymentId: String,          // razorpay_payment_id
    orderIdGateway: String,     // razorpay_order_id
    paymentSignature: String,   // razorpay_signature
    paymentMethod: String,      // e.g. "card", "upi"
    paymentCapturedAt: Date,

    // Refund / returns data (optional)
    refundId: String,
    refundStatus: String,
    refundAmount: Number,

    trackingId: String,
    courierName: String,
    estimatedDelivery: Date,
    deliveredAt: Date,

    returnWindowExpiry: Date,
    isReturnEligible: Boolean,
    returnRequestedAt: Date,
    returnStatus: String,
    returnReason: String,
    returnImages: [String],

    // Anti-fraud meta
    ipAddress: String,
    deviceType: String,
    userAgent: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

module.exports = mongoose.model("Order", orderSchema);