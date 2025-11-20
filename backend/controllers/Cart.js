const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ============================================================
   CREATE CART ITEM
============================================================ */
exports.create = async (req, res) => {
    try {
        const created = await Cart.create(req.body);

        const populated = await Cart.findById(created._id)
            .populate({
                path: "product",
                populate: { path: "brand" }
            });

        return res.status(201).json(populated);

    } catch (error) {
        console.error("Cart create error:", error);
        return res.status(500).json({
            message: "Error adding product to cart, please try again later"
        });
    }
};

/* ============================================================
   GET CART BY USER ID - ✅ FIXED (filters soft-deleted products)
============================================================ */
exports.getByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        // Load cart items with product details
        const items = await Cart.find({ user: userId })
            .populate({
                path: "product",
                populate: { path: "brand" }
            })
            .lean();

        // ✅ FIXED: Filter both null AND soft-deleted products
        const valid = items.filter(i =>
            i.product !== null && !i.product.isDeleted
        );

        // Clean invalid ones (null or soft-deleted)
        const invalid = items.filter(i =>
            i.product === null || i.product?.isDeleted
        );

        if (invalid.length > 0) {
            await Cart.deleteMany({
                _id: { $in: invalid.map(i => i._id) }
            });
            console.log(`Auto-removed ${invalid.length} invalid cart items for user ${userId}`);
        }

        return res.status(200).json(valid);

    } catch (error) {
        console.error("Cart getByUserId error:", error);
        return res.status(500).json({
            message: "Error fetching cart items, please try again later"
        });
    }
};

/* ============================================================
   UPDATE CART ITEM - ✅ FIXED (checks soft-deleted)
============================================================ */
exports.updateById = async (req, res) => {
    try {
        const id = req.params.id;

        let updated = await Cart.findByIdAndUpdate(id, req.body, {
            new: true
        }).populate({
            path: "product",
            populate: { path: "brand" }
        });

        if (!updated) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        // ✅ FIXED: Check both null AND soft-deleted
        // Product deleted → remove cart item permanently
        if (!updated.product || updated.product.isDeleted) {
            await Cart.findByIdAndDelete(id);
            return res.status(410).json({
                message: "Product no longer available"
            });
        }

        return res.status(200).json(updated);

    } catch (error) {
        console.error("Cart update error:", error);
        return res.status(500).json({
            message: "Error updating cart item, please try again later"
        });
    }
};

/* ============================================================
   DELETE ONE CART ITEM
============================================================ */
exports.deleteById = async (req, res) => {
    try {
        const deleted = await Cart.findByIdAndDelete(req.params.id);
        return res.status(200).json(deleted);

    } catch (error) {
        console.error("Cart delete error:", error);
        return res.status(500).json({
            message: "Error deleting cart item, please try again later"
        });
    }
};

/* ============================================================
   CLEAR ENTIRE CART FOR USER
============================================================ */
exports.deleteByUserId = async (req, res) => {
    try {
        await Cart.deleteMany({ user: req.params.id });
        return res.sendStatus(204);

    } catch (error) {
        console.error("Clear cart error:", error);
        return res.status(500).json({
            message: "Some error occurred while resetting your cart"
        });
    }
};