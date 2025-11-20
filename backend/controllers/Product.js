const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Review = require("../models/Review");

/* ============================================================
   CREATE PRODUCT
============================================================ */
exports.create = async (req, res) => {
    try {
        const created = await Product.create(req.body);

        const populated = await Product.findById(created._id)
            .populate("brand")
            .populate("category");

        return res.status(201).json(populated);

    } catch (error) {
        console.error("Product create error:", error);
        return res.status(500).json({
            message: "Error adding product, please try again later"
        });
    }
};

/* ============================================================
   SOFT DELETE PRODUCT (safe delete)
============================================================ */
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

        // Cleanup relations
        await Cart.deleteMany({ product: id });
        await Wishlist.deleteMany({ product: id });
        await Review.deleteMany({ product: id });

        return res.status(200).json({
            message: "Product deleted and dependencies cleaned",
            product
        });

    } catch (err) {
        console.error("Soft delete product error:", err);
        return res.status(500).json({
            message: "Failed to delete product"
        });
    }
};

/* ============================================================
   GET ALL PRODUCTS (filter + search + pagination)
============================================================ */
exports.getAll = async (req, res) => {
    try {
        let filter = {};
        const sort = {};
        let skip = 0;
        let limit = 0;

        // Hide deleted for normal users
        if (req.query.user) filter.isDeleted = false;

        if (req.query.isDeleted !== undefined) {
            filter.isDeleted = req.query.isDeleted === "true";
        }

        // Search support
        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            filter.$or = [{ title: s }, { description: s }];
        }

        // Filters
        if (req.query.brand) filter.brand = { $in: req.query.brand };
        if (req.query.category) filter.category = { $in: req.query.category };

        // Sort
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

        const totalDocs = await Product.countDocuments(filter);

        let query = Product.find(filter)
            .populate("brand")
            .populate("category")
            .sort(sort);

        if (limit) query = query.skip(skip).limit(limit);

        const results = await query.exec();

        res.set("X-Total-Count", totalDocs);
        return res.status(200).json(results);

    } catch (error) {
        console.error("Product getAll error:", error);
        return res.status(500).json({
            message: "Error fetching products, please try again later"
        });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await Product.countDocuments();
        const deleted = await Product.countDocuments({ isDeleted: true });
        const active = await Product.countDocuments({ isDeleted: false });

        return res.status(200).json({ total, active, deleted });
    } catch (err) {
        console.error("Product stats error:", err);
        return res.status(500).json({ message: "Failed to fetch product stats" });
    }
};

/* ============================================================
   GET PRODUCT BY ID - ✅ FIXED
============================================================ */
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;

        const product = await Product.findById(id)
            .populate("brand")
            .populate("category");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // ✅ FIXED: Return product with isDeleted flag instead of 410
        // This allows frontend to show unavailable state with product details
        if (product.isDeleted && !req.query.admin) {
            return res.status(200).json({
                ...product.toObject(),
                isDeleted: true  // Ensure flag is visible to frontend
            });
        }

        return res.status(200).json(product);

    } catch (error) {
        console.error("Product getById error:", error);
        return res.status(500).json({
            message: "Error getting product details, please try again later"
        });
    }
};

/* ============================================================
   UPDATE PRODUCT
============================================================ */
exports.updateById = async (req, res) => {
    try {
        const id = req.params.id;

        const updated = await Product.findByIdAndUpdate(id, req.body, {
            new: true
        })
            .populate("brand")
            .populate("category");

        if (!updated) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(updated);

    } catch (error) {
        console.error("Product update error:", error);
        return res.status(500).json({
            message: "Error updating product, please try again later"
        });
    }
};

/* ============================================================
   RESTORE PRODUCT
============================================================ */
exports.undeleteById = async (req, res) => {
    try {
        const id = req.params.id;

        const restored = await Product.findByIdAndUpdate(
            id,
            { isDeleted: false },
            { new: true }
        )
            .populate("brand")
            .populate("category");

        if (!restored) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(restored);

    } catch (error) {
        console.error("Product undelete error:", error);
        return res.status(500).json({
            message: "Error restoring product"
        });
    }
};

/* ============================================================
   GET STOCK ONLY
============================================================ */
exports.getStockById = async (req, res) => {
    try {
        const doc = await Product.findById(req.params.id)
            .select("stockQuantity");

        if (!doc) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({ stockQuantity: doc.stockQuantity });

    } catch (error) {
        console.error("getStockById error:", error);
        return res.status(500).json({
            message: "Error fetching stock"
        });
    }
};

/* ============================================================
   ALIAS: soft delete
============================================================ */
exports.deleteById = exports.softDeleteProduct;

/* ============================================================
   FORCE DELETE PRODUCT
============================================================ */
exports.forceDeleteById = async (req, res) => {
    try {
        const id = req.params.id;

        const removed = await Product.findByIdAndDelete(id);

        if (!removed) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        await Cart.deleteMany({ product: id });
        await Wishlist.deleteMany({ product: id });
        await Review.deleteMany({ product: id });

        return res.status(200).json({
            _id: id,
            message: "Product permanently deleted",
            removed
        });

    } catch (error) {
        console.error("Product force delete error:", error);
        return res.status(500).json({
            message: "Error permanently deleting product"
        });
    }
};