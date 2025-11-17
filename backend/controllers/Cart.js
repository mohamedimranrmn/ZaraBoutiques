const Cart = require('../models/Cart');

exports.create = async (req, res) => {
    try {
        const created = new Cart(req.body);
        await created.save();

        const populated = await Cart.findById(created._id)
            .populate({ path: "product", populate: { path: "brand" } });

        res.status(201).json(populated);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error adding product to cart, please try again later' });
    }
};

exports.getByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Cart.find({ user: id })
            .populate({ path: "product", populate: { path: "brand" } });

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error fetching cart items, please try again later' });
    }
};

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await Cart.findByIdAndUpdate(id, req.body, {
            new: true
        }).populate({ path: "product", populate: { path: "brand" } });

        if (!updated) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        res.status(200).json(updated);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error updating cart items, please try again later' });
    }
};

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Cart.findByIdAndDelete(id);

        res.status(200).json(deleted);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error deleting cart item, please try again later' });
    }
};

exports.deleteByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        await Cart.deleteMany({ user: id });
        res.sendStatus(204);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Some error occurred while resetting your cart" });
    }
};
