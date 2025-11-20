const Review = require("../models/Review");
const Product = require("../models/Product");

/* ============================================================
   CREATE REVIEW
   ============================================================ */
exports.create = async (req, res) => {
    try {
        const { user, product } = req.body;

        // Ensure product exists and not deleted
        const productDoc = await Product.findById(product);
        if (!productDoc || productDoc.isDeleted) {
            return res
                .status(400)
                .json({ message: "Cannot review a deleted product" });
        }

        const created = await Review.create(req.body);

        const populated = await Review.findById(created._id).populate({
            path: "user",
            select: "-password",
        });

        return res.status(201).json(populated);

    } catch (error) {
        console.error("Review create error:", error);
        return res
            .status(500)
            .json({ message: "Error posting review, please try again later" });
    }
};

/* ============================================================
   GET REVIEWS FOR PRODUCT
   ============================================================ */
exports.getByProductId = async (req, res) => {
    try {
        const productId = req.params.id;

        let skip = 0;
        let limit = 0;

        if (req.query.page && req.query.limit) {
            const page = Number(req.query.page);
            const pageSize = Number(req.query.limit);
            skip = (page - 1) * pageSize;
            limit = pageSize;
        }

        const total = await Review.countDocuments({ product: productId });

        const result = await Review.find({ product: productId })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "user",
                select: "-password"
            });

        res.set("X-Total-Count", total);
        return res.status(200).json(result);

    } catch (error) {
        console.error("Review fetch error:", error);
        return res
            .status(500)
            .json({ message: "Error getting reviews, please try again later" });
    }
};

/* ============================================================
   UPDATE REVIEW
   ============================================================ */
exports.updateById = async (req, res) => {
    try {
        const updated = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        }).populate({
            path: "user",
            select: "-password"
        });

        if (!updated) {
            return res.status(404).json({ message: "Review not found" });
        }

        return res.status(200).json(updated);

    } catch (error) {
        console.error("Review update error:", error);
        return res
            .status(500)
            .json({ message: "Error updating review, please try again later" });
    }
};

/* ============================================================
   DELETE REVIEW
   ============================================================ */
exports.deleteById = async (req, res) => {
    try {
        const deleted = await Review.findByIdAndDelete(req.params.id);
        return res.status(200).json(deleted);

    } catch (error) {
        console.error("Review delete error:", error);
        return res
            .status(500)
            .json({ message: "Error deleting review, please try again later" });
    }
};
