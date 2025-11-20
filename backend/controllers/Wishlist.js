const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

/* ============================================================
   CREATE WISHLIST ITEM
   ============================================================ */
exports.create = async (req, res) => {
    try {
        const created = await Wishlist.create(req.body);

        const populated = await Wishlist.findById(created._id)
            .populate({
                path: "product",
                populate: { path: "brand" }
            });

        return res.status(201).json(populated);

    } catch (error) {
        console.error("Wishlist create error:", error);
        return res
            .status(500)
            .json({ message: "Error adding product to wishlist, please try again later" });
    }
};

/* ============================================================
   GET WISHLIST BY USER - ✅ FIXED (filters soft-deleted)
   ============================================================ */
exports.getByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        let skip = 0;
        let limit = 0;

        if (req.query.page && req.query.limit) {
            const page = Number(req.query.page);
            const pageSize = Number(req.query.limit);
            skip = (page - 1) * pageSize;
            limit = pageSize;
        }

        const items = await Wishlist.find({ user: userId })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "product",
                populate: { path: "brand" }
            })
            .lean();

        // ✅ FIXED: Filter both null AND soft-deleted products
        const valid = items.filter((i) =>
            i.product !== null && !i.product.isDeleted
        );

        // Auto-delete invalid references (null or soft-deleted)
        const invalid = items.filter((i) =>
            i.product === null || i.product?.isDeleted
        );

        if (invalid.length > 0) {
            await Wishlist.deleteMany({
                _id: { $in: invalid.map((i) => i._id) }
            });
            console.log(`Auto-removed ${invalid.length} invalid wishlist items for user ${userId}`);
        }

        // ✅ Return direct array (consistent with Cart)
        res.set("X-Total-Count", valid.length);
        return res.status(200).json(valid);

    } catch (error) {
        console.error("Wishlist get error:", error);
        return res
            .status(500)
            .json({ message: "Error fetching your wishlist, please try again later" });
    }
};

/* ============================================================
   UPDATE WISHLIST ITEM - ✅ FIXED (checks soft-deleted)
   ============================================================ */
exports.updateById = async (req, res) => {
    try {
        const id = req.params.id;

        let updated = await Wishlist.findByIdAndUpdate(id, req.body, {
            new: true
        }).populate({
            path: "product",
            populate: { path: "brand" }
        });

        if (!updated) {
            return res.status(404).json({ message: "Wishlist item not found" });
        }

        // ✅ FIXED: Check both null AND soft-deleted
        // If product is deleted, remove wishlist item
        if (!updated.product || updated.product.isDeleted) {
            await Wishlist.findByIdAndDelete(id);
            return res.status(410).json({ message: "Product no longer available" });
        }

        return res.status(200).json(updated);

    } catch (error) {
        console.error("Wishlist update error:", error);
        return res
            .status(500)
            .json({ message: "Error updating your wishlist, please try again later" });
    }
};

/* ============================================================
   DELETE WISHLIST ITEM
   ============================================================ */
exports.deleteById = async (req, res) => {
    try {
        const deleted = await Wishlist.findByIdAndDelete(req.params.id);
        return res.status(200).json(deleted);

    } catch (error) {
        console.error("Wishlist delete error:", error);
        return res
            .status(500)
            .json({ message: "Error deleting wishlist item, please try again later" });
    }
};