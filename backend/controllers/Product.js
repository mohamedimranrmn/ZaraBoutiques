// backend/controllers/Product.js
const Product = require("../models/Product");

/* ============================================================
   CREATE PRODUCT
   ============================================================ */
exports.create = async (req, res) => {
    try {
        const created = new Product(req.body);
        await created.save();
        res.status(201).json(created);
    } catch (error) {
        console.log("Product create error:", error);
        return res.status(500).json({
            message: "Error adding product, please try again later"
        });
    }
};

/* ============================================================
   GET ALL PRODUCTS (Filters + Search + Sorting + Pagination)
   ============================================================ */
exports.getAll = async (req, res) => {
    try {
        const filter = {};
        const sort = {};
        let skip = 0;
        let limit = 0;

        // Search query (multi-field: title, brand.name, category.name)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex }
            ];
        }

        // Brand filter
        if (req.query.brand) {
            filter.brand = { $in: req.query.brand };
        }

        // Category filter
        if (req.query.category) {
            filter.category = { $in: req.query.category };
        }

        // isDeleted filter (admin / frontend)
        if (req.query.isDeleted !== undefined) {
            filter.isDeleted = req.query.isDeleted === "true";
        } else if (req.query.user) {
            // hide deleted for normal frontend users
            filter.isDeleted = false;
        }

        // Sorting
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order === "desc" ? -1 : 1;
        }

        // Pagination
        if (req.query.page && req.query.limit) {
            const pageSize = Number(req.query.limit);
            const page = Number(req.query.page);
            skip = pageSize * (page - 1);
            limit = pageSize;
        }

        // First, get all matching products with populated fields for search
        let query = Product.find(filter)
            .populate("brand")
            .populate("category")
            .sort(sort);

        // If there's a search term, we need to filter after population
        if (req.query.search) {
            const allResults = await query.exec();
            const searchRegex = new RegExp(req.query.search, "i");

            // Filter results based on populated brand and category names
            const filteredResults = allResults.filter(product => {
                const matchesTitle = searchRegex.test(product.title);
                const matchesDescription = searchRegex.test(product.description);
                const matchesBrand = product.brand?.name && searchRegex.test(product.brand.name);
                const matchesCategory = product.category?.name && searchRegex.test(product.category.name);

                return matchesTitle || matchesDescription || matchesBrand || matchesCategory;
            });

            const totalDocs = filteredResults.length;
            const results = filteredResults.slice(skip, skip + limit || filteredResults.length);

            res.set("X-Total-Count", totalDocs);
            return res.status(200).json(results);
        }

        // No search - proceed normally
        const totalDocs = await Product.countDocuments(filter);

        if (limit > 0) {
            query = query.skip(skip).limit(limit);
        }

        const results = await query.exec();

        res.set("X-Total-Count", totalDocs);
        res.status(200).json(results);
    } catch (error) {
        console.log("Product getAll error:", error);
        res.status(500).json({
            message: "Error fetching products, please try again later"
        });
    }
};

/* ============================================================
   GET PRODUCT BY ID
   ============================================================ */
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Product.findById(id)
            .populate("brand")
            .populate("category");

        if (!result) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(result);
    } catch (error) {
        console.log("Product getById error:", error);
        res.status(500).json({
            message: "Error getting product details, please try again later"
        });
    }
};

/* ============================================================
   UPDATE PRODUCT
   ============================================================ */
exports.updateById = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(updated);
    } catch (error) {
        console.log("Product update error:", error);
        res.status(500).json({
            message: "Error updating product, please try again later"
        });
    }
};

/* ============================================================
   UNDELETE PRODUCT (RESTORE)
   ============================================================ */
exports.undeleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const unDeleted = await Product.findByIdAndUpdate(
            id,
            { isDeleted: false },
            { new: true }
        ).populate("brand");

        if (!unDeleted) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(unDeleted);
    } catch (error) {
        console.log("Product undelete error:", error);
        res.status(500).json({
            message: "Error restoring product, please try again later"
        });
    }
};

/* ============================================================
   GET STOCK BY PRODUCT ID (for live refresh)
   ============================================================ */
exports.getStockById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select("stockQuantity");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ stockQuantity: product.stockQuantity });
    } catch (error) {
        console.log("getStockById error:", error);
        res.status(500).json({ message: "Error fetching stock" });
    }
};

/* ============================================================
   SOFT DELETE PRODUCT
   ============================================================ */
exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        ).populate("brand");

        if (!deleted) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(deleted);
    } catch (error) {
        console.log("Product soft delete error:", error);
        res.status(500).json({
            message: "Error deleting product, please try again later"
        });
    }
};

/* ============================================================
   FORCE DELETE PRODUCT (PERMANENT)
   ============================================================ */
exports.forceDeleteById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            _id: id,
            message: "Product permanently deleted",
            deletedProduct
        });

    } catch (error) {
        console.log("Product force delete error:", error);
        return res.status(500).json({
            message: "Error permanently deleting product, please try again later"
        });
    }
};