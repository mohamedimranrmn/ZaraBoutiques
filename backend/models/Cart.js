// backend/models/Cart.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '6', '7', '8', '9', '10', '11', '12', 'One Size', null],
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

// IMPORTANT: Unique combination of user + product + size
// This allows same product with different sizes as separate cart items
CartSchema.index({ user: 1, product: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('Cart', CartSchema);