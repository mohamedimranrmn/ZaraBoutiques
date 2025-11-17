import { axiosi } from "../../config/axios";

export const addToCart = async (data) => {
    const res = await axiosi.post("/cart", data);
    return res.data;
};

export const fetchCartByUserId = async (id) => {
    const res = await axiosi.get(`/cart/user/${id}`);
    return res.data;
};

export const updateCartItemById = async (update) => {
    const res = await axiosi.patch(`/cart/${update._id}`, update);
    return res.data;
};

export const deleteCartItemById = async (id) => {
    const res = await axiosi.delete(`/cart/${id}`);
    return res.data;
};

export const resetCartByUserId = async (userId) => {
    const res = await axiosi.delete(`/cart/user/${userId}`);
    return res.data;
};