import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    createOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getAllOrders,
    getOrderByUserId,
    getOrderById,
    updateOrderById
} from './OrderApi';

const initialState = {
    status: "idle",
    orderUpdateStatus: "idle",
    orderFetchStatus: "idle",
    orders: [],
    currentOrder: null,
    errors: null,
    successMessage: null
};

/* ============================================================
   CREATE COD ORDER
   ============================================================ */
export const createOrderAsync = createAsyncThunk(
    "orders/createOrderAsync",
    async (order) => {
        const createdOrder = await createOrder(order);
        return createdOrder;
    }
);

/* ============================================================
   CREATE RAZORPAY ORDER
   ============================================================ */
export const createRazorpayOrderAsync = createAsyncThunk(
    "orders/createRazorpayOrderAsync",
    async (payload) => {
        const res = await createRazorpayOrder(payload);
        return res;
    }
);

/* ============================================================
   VERIFY PAYMENT
   ============================================================ */
export const verifyRazorpayPaymentAsync = createAsyncThunk(
    "orders/verifyRazorpayPaymentAsync",
    async (payload) => {
        const res = await verifyRazorpayPayment(payload);
        return res;
    }
);

/* ============================================================
   FETCH ORDERS
   ============================================================ */
export const getAllOrdersAsync = createAsyncThunk(
    "orders/getAllOrdersAsync",
    async () => {
        const orders = await getAllOrders();
        return orders;
    }
);

export const getOrderByUserIdAsync = createAsyncThunk(
    "orders/getOrderByUserIdAsync",
    async (id) => {
        const orders = await getOrderByUserId(id);
        return orders;
    }
);

/* ============================================================
   GET ORDER BY ID  (Required for OrderSuccessPage refresh)
   ============================================================ */
export const getOrderByIdAsync = createAsyncThunk(
    "orders/getOrderByIdAsync",
    async (id) => {
        const order = await getOrderById(id);
        return order;
    }
);

/* ============================================================
   UPDATE ORDER (ADMIN)
   ============================================================ */
export const updateOrderByIdAsync = createAsyncThunk(
    "orders/updateOrderByIdAsync",
    async (update) => {
        const updatedOrder = await updateOrderById(update);
        return updatedOrder;
    }
);

/* ============================================================
   SLICE
   ============================================================ */
const orderSlice = createSlice({
    name: 'orderSlice',
    initialState,
    reducers: {
        resetCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        resetOrderUpdateStatus: (state) => {
            state.orderUpdateStatus = 'idle';
        },
        resetOrderFetchStatus: (state) => {
            state.orderFetchStatus = 'idle';
        }
    },
    extraReducers: (builder) => {

        /* ======================================================
           CREATE COD ORDER
           ====================================================== */
        builder
            .addCase(createOrderAsync.pending, (state) => {
                state.status = 'pending';
            })
            .addCase(createOrderAsync.fulfilled, (state, action) => {
                state.status = 'fulfilled';
                state.orders.push(action.payload);
                state.currentOrder = action.payload;
            })
            .addCase(createOrderAsync.rejected, (state, action) => {
                state.status = 'rejected';
                state.errors = action.error;
            });

        /* ======================================================
           GET ORDER BY ID (for OrderSuccessPage)
           ====================================================== */
        builder
            .addCase(getOrderByIdAsync.pending, (state) => {
                state.orderFetchStatus = "pending";
            })
            .addCase(getOrderByIdAsync.fulfilled, (state, action) => {
                state.orderFetchStatus = "fulfilled";
                state.currentOrder = action.payload;
            })
            .addCase(getOrderByIdAsync.rejected, (state, action) => {
                state.orderFetchStatus = "rejected";
                state.errors = action.error;
            });

        /* ======================================================
           RAZORPAY — CREATE ORDER
           ====================================================== */
        builder
            .addCase(createRazorpayOrderAsync.pending, (state) => {
                state.status = "pending";
            })
            .addCase(createRazorpayOrderAsync.fulfilled, (state, action) => {
                state.status = "fulfilled";
                state.currentOrder = action.payload;
            })
            .addCase(createRazorpayOrderAsync.rejected, (state, action) => {
                state.status = "rejected";
                state.errors = action.error;
            });

        /* ======================================================
           RAZORPAY — VERIFY PAYMENT
           ====================================================== */
        builder
            .addCase(verifyRazorpayPaymentAsync.pending, (state) => {
                state.status = "pending";
            })
            .addCase(verifyRazorpayPaymentAsync.fulfilled, (state, action) => {
                state.status = "fulfilled";
                state.currentOrder = action.payload;
                state.orders.push(action.payload);
            })
            .addCase(verifyRazorpayPaymentAsync.rejected, (state, action) => {
                state.status = "rejected";
                state.errors = action.error;
            });

        /* ======================================================
           ADMIN — FETCH ALL ORDERS
           ====================================================== */
        builder
            .addCase(getAllOrdersAsync.pending, (state) => {
                state.orderFetchStatus = 'pending';
            })
            .addCase(getAllOrdersAsync.fulfilled, (state, action) => {
                state.orderFetchStatus = 'fulfilled';
                state.orders = action.payload;
            })
            .addCase(getAllOrdersAsync.rejected, (state, action) => {
                state.orderFetchStatus = 'rejected';
                state.errors = action.error;
            });

        /* ======================================================
           USER — FETCH ORDERS
           ====================================================== */
        builder
            .addCase(getOrderByUserIdAsync.pending, (state) => {
                state.orderFetchStatus = 'pending';
            })
            .addCase(getOrderByUserIdAsync.fulfilled, (state, action) => {
                state.orderFetchStatus = 'fulfilled';
                state.orders = action.payload;
            })
            .addCase(getOrderByUserIdAsync.rejected, (state, action) => {
                state.orderFetchStatus = 'rejected';
                state.errors = action.error;
            });

        /* ======================================================
           UPDATE ORDER (ADMIN)
           ====================================================== */
        builder
            .addCase(updateOrderByIdAsync.pending, (state) => {
                state.orderUpdateStatus = 'pending';
            })
            .addCase(updateOrderByIdAsync.fulfilled, (state, action) => {
                state.orderUpdateStatus = 'fulfilled';
                const index = state.orders.findIndex(
                    (o) => o._id === action.payload._id
                );
                if (index !== -1) {
                    state.orders[index] = action.payload;
                }
            })
            .addCase(updateOrderByIdAsync.rejected, (state, action) => {
                state.orderUpdateStatus = 'rejected';
                state.errors = action.error;
            });
    }
});

/* ============================================================
   EXPORTS
   ============================================================ */

export const {
    resetCurrentOrder,
    resetOrderUpdateStatus,
    resetOrderFetchStatus
} = orderSlice.actions;

export const selectOrderStatus = (state) => state.OrderSlice.status;
export const selectOrders = (state) => state.OrderSlice.orders;
export const selectOrdersErrors = (state) => state.OrderSlice.errors;
export const selectCurrentOrder = (state) => state.OrderSlice.currentOrder;
export const selectOrderUpdateStatus = (state) => state.OrderSlice.orderUpdateStatus;
export const selectOrderFetchStatus = (state) => state.OrderSlice.orderFetchStatus;

export default orderSlice.reducer;
