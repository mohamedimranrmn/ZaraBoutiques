// controllers/ProductController.js

const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Review = require("../models/Review");

/* ------------------------------------------------------------
   HELPER: Attach computed discounted price + normalized fields
------------------------------------------------------------ */
function attachComputedFields(p) {
    const obj = p.toObject();

    const percentage = Number(obj.discountPercentage) || 0;
    const originalPrice = Number(obj.price);

    obj.discountPercentage = percentage;

    obj.discountedPrice =
        percentage > 0
            ? Math.round(originalPrice - originalPrice * (percentage / 100))
            : originalPrice;

    return obj;
}

/* ------------------------------------------------------------
   CREATE PRODUCT
------------------------------------------------------------ */
exports.create = async (req, res) => {
    try {
        const created = await Product.create(req.body);

        let populated = await Product.findById(created._id)
            .populate("brand")
            .populate("category");

        populated = attachComputedFields(populated);

        return res.status(201).json(populated);

    } catch (error) {
        console.error("Product create error:", error);
        return res.status(500).json({ message: "Error adding product" });
    }
};

/* ------------------------------------------------------------
   SOFT DELETE PRODUCT (safe delete)
------------------------------------------------------------ */
exports.softDeleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const product = await Product.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Clean relations
        await Cart.deleteMany({ product: id });
        await Wishlist.deleteMany({ product: id });
        await Review.deleteMany({ product: id });

        return res.status(200).json({
            message: "Product deleted and dependencies cleaned",
            product: attachComputedFields(product),
        });

    } catch (err) {
        console.error("Soft delete product error:", err);
        return res.status(500).json({ message: "Failed to delete product" });
    }
};

/* ------------------------------------------------------------
   GET ALL PRODUCTS (search + filters + sort + pagination)
------------------------------------------------------------ */
exports.getAll = async (req, res) => {
    try {
        let filter = {};
        const sort = {};
        let skip = 0;
        let limit = 0;

        // Hide deleted products for normal users
        if (req.query.user) filter.isDeleted = false;

        // Admin filter
        if (req.query.isDeleted !== undefined) {
            filter.isDeleted = req.query.isDeleted === "true";
        }

        // Search
        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            filter.$or = [{ title: s }, { description: s }];
        }

        // Brand filter
        if (req.query.brand) filter.brand = { $in: req.query.brand };

        // Category filter
        if (req.query.category) filter.category = { $in: req.query.category };

        // Sorting
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order === "desc" ? -1 : 1;
        }

        // Pagination
        if (req.query.page && req.query.limit) {
            const page = Number(req.query.page);
            const pageSize = Number(req.query.limit);
            skip = (page - 1) * pageSize;
            limit = pageSize;
        }

        // Count BEFORE pagination
        const totalDocs = await Product.countDocuments(filter);

        let query = Product.find(filter)
            .populate("brand")
            .populate("category")
            .sort(sort);

        if (limit) query = query.skip(skip).limit(limit);

        let results = await query.exec();

        const processed = results.map((p) => attachComputedFields(p));

        res.set("X-Total-Count", totalDocs);

        return res.status(200).json(processed);

    } catch (error) {
        console.error("Product getAll error:", error);
        return res.status(500).json({ message: "Error fetching products" });
    }
};

/* ------------------------------------------------------------
   GET PRODUCT STATS
------------------------------------------------------------ */
exports.getStats = async (req, res) => {
    try {
        const total = await Product.countDocuments();
        const deleted = await Product.countDocuments({ isDeleted: true });
        const active = await Product.countDocuments({ isDeleted: false });

        return res.status(200).json({ total, active, deleted });

    } catch (err) {
        console.error("Product stats error:", err);
        return res.status(500).json({ message: "Failed to fetch stats" });
    }
};

/* ------------------------------------------------------------
   GET PRODUCT BY ID
------------------------------------------------------------ */
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;

        const product = await Product.findById(id)
            .populate("brand")
            .populate("category");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const processed = attachComputedFields(product);

        // If deleted and not admin → still return but mark unavailable
        if (product.isDeleted && !req.query.admin) {
            return res.status(200).json({ ...processed, isDeleted: true });
        }

        return res.status(200).json(processed);

    } catch (error) {
        console.error("Product getById error:", error);
        return res.status(500).json({ message: "Error fetching product" });
    }
};

/* ------------------------------------------------------------
   UPDATE PRODUCT
------------------------------------------------------------ */
exports.updateById = async (req, res) => {
    try {
        const id = req.params.id;

        let updated = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
        })
            .populate("brand")
            .populate("category");

        if (!updated) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(attachComputedFields(updated));

    } catch (error) {
        console.error("Product update error:", error);
        return res.status(500).json({ message: "Error updating product" });
    }
};

/* ------------------------------------------------------------
   RESTORE PRODUCT
------------------------------------------------------------ */
exports.undeleteById = async (req, res) => {
    try {
        const id = req.params.id;

        let restored = await Product.findByIdAndUpdate(
            id,
            { isDeleted: false },
            { new: true }
        )
            .populate("brand")
            .populate("category");

        if (!restored) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(attachComputedFields(restored));

    } catch (error) {
        console.error("Product undelete error:", error);
        return res.status(500).json({ message: "Error restoring product" });
    }
};

/* ------------------------------------------------------------
   GET STOCK ONLY
------------------------------------------------------------ */
exports.getStockById = async (req, res) => {
    try {
        const doc = await Product.findById(req.params.id).select("stockQuantity");

        if (!doc) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({ stockQuantity: doc.stockQuantity });

    } catch (error) {
        console.error("getStockById error:", error);
        return res.status(500).json({ message: "Error fetching stock" });
    }
};

/* ------------------------------------------------------------
   FORCE DELETE PRODUCT (permanent)
------------------------------------------------------------ */
exports.forceDeleteById = async (req, res) => {
    try {
        const id = req.params.id;

        const removed = await Product.findByIdAndDelete(id);

        if (!removed) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Cart.deleteMany({ product: id });
        await Wishlist.deleteMany({ product: id });
        await Review.deleteMany({ product: id });

        return res.status(200).json({
            _id: id,
            message: "Product permanently deleted",
        });

    } catch (error) {
        console.error("Product force delete error:", error);
        return res.status(500).json({ message: "Error permanently deleting product" });
    }
};

/* Alias */
exports.deleteById = exports.softDeleteProduct;
