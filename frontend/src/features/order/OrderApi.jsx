import {axiosi} from '../../config/axios'


export const createOrder=async(order)=>{
    try {
        const res=await axiosi.post("/orders",order)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getOrderById = async (id) => {
    const res = await axiosi.get(`/orders/${id}`);
    return res.data;
};

export const getOrderByUserId=async(id)=>{
    try {
        const res=await axiosi.get(`/orders/user/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getAllOrders=async()=>{
    try {
        const res=await axiosi.get(`/orders`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const updateOrderById=async(update)=>{
    try {
        const res=await axiosi.patch(`/orders/${update._id}`,update)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

// ===========================================
// CREATE RAZORPAY ORDER (Backend: /orders/razorpay/create)
// ===========================================
export const createRazorpayOrder = async (payload) => {
    try {
        const res = await axiosi.post("/orders/razorpay/create", payload);
        return res.data;
    } catch (error) {
        throw error.response.data;
    }
};

// ===========================================
// VERIFY RAZORPAY PAYMENT (Backend: /orders/razorpay/verify)
// ===========================================
export const verifyRazorpayPayment = async (payload) => {
    try {
        const res = await axiosi.post("/orders/razorpay/verify", payload);
        return res.data;
    } catch (error) {
        throw error.response.data;
    }
};
