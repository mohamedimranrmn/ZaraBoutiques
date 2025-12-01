// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, // original price
    discountPercentage: { type: Number, default: 0 }, // percentage (0–99)
    discountedPrice: { type: Number, default: null }, // computed price

    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    thumbnail: String,
    images: [String],
    stockQuantity: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

/* ======================================================
   AUTO-CALCULATE DISCOUNTED PRICE BEFORE SAVE / UPDATE
====================================================== */
ProductSchema.pre("save", function (next) {
    if (this.discountPercentage > 0) {
        const discount = (this.price * this.discountPercentage) / 100;
        this.discountedPrice = Number((this.price - discount).toFixed(2));
    } else {
        this.discountedPrice = this.price;
    }
    next();
});

/* ======================================================
   APPLY SAME LOGIC FOR findOneAndUpdate()
====================================================== */
ProductSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();

    const price = update.price ?? this._update.$set?.price;
    const percentage = update.discountPercentage ?? this._update.$set?.discountPercentage;

    if (price !== undefined || percentage !== undefined) {
        const newPrice = price !== undefined ? price : this._update.price;
        const newDiscount = percentage !== undefined ? percentage : this._update.discountPercentage;

        if (newDiscount > 0) {
            const discountAmount = (newPrice * newDiscount) / 100;
            update.discountedPrice = Number((newPrice - discountAmount).toFixed(2));
        } else {
            update.discountedPrice = newPrice;
        }
    }

    next();
});

module.exports = mongoose.model("Product", ProductSchema);
