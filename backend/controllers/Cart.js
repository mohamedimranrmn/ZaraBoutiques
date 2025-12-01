// backend/controllers/cartController.js
const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ============================================================
   CREATE CART ITEM
   - requires price in request body (frontend must pass discounted price)
   - if duplicate (user+product+size) exists, update quantity instead
============================================================ */
exports.create = async (req, res) => {
    try {
        const { user, product, quantity = 1, size = null, price } = req.body;

        if (!user || !product) {
            return res.status(400).json({ message: "Missing user or product" });
        }

        if (typeof price !== "number" || Number.isNaN(price)) {
            return res.status(400).json({ message: "Valid price is required" });
        }

        // Ensure product exists and not soft-deleted
        const prod = await Product.findById(product).lean();
        if (!prod || prod.isDeleted) {
            return res.status(410).json({ message: "Product not available" });
        }

        // Try to upsert: if same (user, product, size) exists, increment quantity
        const existing = await Cart.findOne({ user, product, size });

        if (existing) {
            existing.quantity = Math.max(1, existing.quantity + Number(quantity));
            // Keep the stored price as-is (do not overwrite historical price),
            // but if you want to update the price to current discounted price, uncomment:
            // existing.price = price;
            const saved = await existing.save();
            const populated = await Cart.findById(saved._id).populate({
                path: "product",
                populate: { path: "brand" }
            });
            return res.status(200).json(populated);
        }

        const created = await Cart.create({
            user,
            product,
            quantity,
            size,
            price
        });

        const populated = await Cart.findById(created._id)
            .populate({
                path: "product",
                populate: { path: "brand" }
            });

        return res.status(201).json(populated);

    } catch (error) {
        console.error("Cart create error:", error);
        // Unique index violation -> return conflict
        if (error && error.code === 11000) {
            return res.status(409).json({ message: "Cart item already exists" });
        }
        return res.status(500).json({
            message: "Error adding product to cart, please try again later"
        });
    }
};

/* ============================================================
   GET CART BY USER ID
   - Returns valid cart items (filters null/soft-deleted products)
   - Auto-removes invalid items from DB
============================================================ */
exports.getByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        const items = await Cart.find({ user: userId })
            .populate({
                path: "product",
                populate: { path: "brand" }
            })
            .lean();

        const valid = items.filter(i => i.product !== null && !i.product.isDeleted);
        const invalid = items.filter(i => i.product === null || i.product?.isDeleted);

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
   UPDATE CART ITEM BY ID
   - allow updating quantity (and optionally size)
   - do not overwrite price unless explicitly provided
   - if product deleted -> remove cart item and return 410
============================================================ */
exports.updateById = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = {};

        // Only accept explicit fields we allow to update
        if (typeof req.body.quantity !== "undefined") updates.quantity = req.body.quantity;
        if (typeof req.body.size !== "undefined") updates.size = req.body.size;
        if (typeof req.body.price === "number") updates.price = req.body.price; // optional

        let updated = await Cart.findByIdAndUpdate(id, updates, { new: true })
            .populate({
                path: "product",
                populate: { path: "brand" }
            });

        if (!updated) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        // If product removed or soft-deleted, remove cart item
        if (!updated.product || updated.product.isDeleted) {
            await Cart.findByIdAndDelete(id);
            return res.status(410).json({ message: "Product no longer available" });
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
   DELETE CART ITEM BY ID
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
