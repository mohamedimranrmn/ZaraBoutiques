// backend/models/Product.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        brand: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        discountPercentage: {
            type: Number,
            default: 0,
        },
        stockQuantity: {
            type: Number,
            required: true,
            default: 0,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            required: true,
        },
        // SIZE FIELDS - ADD THESE
        sizes: {
            type: [String],
            default: [],
            enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '6', '7', '8', '9', '10', '11', '12', 'One Size', '']
        },
        requiresSize: {
            type: Boolean,
            default: false
        },
        // END SIZE FIELDS
        isDeleted: {
            type: Boolean,
            default: false,
        },
        sku: String,
        weight: Number,
        categoryName: String,
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Product", productSchema);