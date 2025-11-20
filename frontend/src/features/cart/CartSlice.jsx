// features/cart/CartSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    addToCart,
    fetchCartByUserId,
    updateCartItemById,
    deleteCartItemById,
    resetCartByUserId
} from './CartApi';

const initialState = {
    status: "idle",
    items: [],
    cartItemAddStatus: "idle",
    cartItemRemoveStatus: "idle",
    errors: null
};

// =============================
// ASYNC THUNKS
// =============================
export const addToCartAsync = createAsyncThunk(
    'cart/addToCartAsync',
    async (item, { rejectWithValue }) => {
        try {
            return await addToCart(item);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchCartByUserIdAsync = createAsyncThunk(
    'cart/fetchCartByUserIdAsync',
    async (id, { rejectWithValue }) => {
        try {
            return await fetchCartByUserId(id);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const updateCartItemByIdAsync = createAsyncThunk(
    'cart/updateCartItemByIdAsync',
    async (payload, { rejectWithValue }) => {
        try {
            return await updateCartItemById(payload);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const deleteCartItemByIdAsync = createAsyncThunk(
    'cart/deleteCartItemByIdAsync',
    async (id, { rejectWithValue }) => {
        try {
            return await deleteCartItemById(id);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const resetCartByUserIdAsync = createAsyncThunk(
    'cart/resetCartByUserIdAsync',
    async (userId, { rejectWithValue }) => {
        try {
            return await resetCartByUserId(userId);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// =============================
// SLICE
// =============================
const cartSlice = createSlice({
    name: "CartSlice",
    initialState,
    reducers: {
        resetCartItemAddStatus: (state) => {
            state.cartItemAddStatus = 'idle';
        },
        resetCartItemRemoveStatus: (state) => {
            state.cartItemRemoveStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder

            // ADD TO CART
            .addCase(addToCartAsync.pending, (state) => {
                state.cartItemAddStatus = 'pending';
            })
            .addCase(addToCartAsync.fulfilled, (state, action) => {
                state.cartItemAddStatus = 'fulfilled';
                state.items.push(action.payload);
            })
            .addCase(addToCartAsync.rejected, (state, action) => {
                state.cartItemAddStatus = 'rejected';
                state.errors = action.payload;
            })

            // FETCH CART
            .addCase(fetchCartByUserIdAsync.pending, (state) => {
                state.status = "pending";
            })
            .addCase(fetchCartByUserIdAsync.fulfilled, (state, action) => {
                state.status = 'fulfilled';
                state.items = action.payload;      // backend already filters missing/soft-deleted products
            })
            .addCase(fetchCartByUserIdAsync.rejected, (state, action) => {
                state.status = 'rejected';
                state.errors = action.payload;
            })

            // UPDATE CART ITEM
            .addCase(updateCartItemByIdAsync.fulfilled, (state, action) => {
                const updated = action.payload;

                // If backend returned 410 (product deleted), backend already removed it
                if (!updated || !updated._id) return;

                const index = state.items.findIndex(it => it._id === updated._id);
                if (index !== -1) {
                    state.items[index] = updated;
                }
            })

            // DELETE CART ITEM
            .addCase(deleteCartItemByIdAsync.fulfilled, (state, action) => {
                state.cartItemRemoveStatus = 'fulfilled';
                const deleted = action.payload;

                if (deleted && deleted._id) {
                    state.items = state.items.filter(it => it._id !== deleted._id);
                }
            })

            // RESET CART
            .addCase(resetCartByUserIdAsync.fulfilled, (state) => {
                state.items = [];
            });
    }
});

// =============================
// SELECTORS
// =============================
export const selectCartItems = (state) => state.CartSlice.items;
export const selectCartItemAddStatus = (state) => state.CartSlice.cartItemAddStatus;
export const selectCartItemRemoveStatus = (state) => state.CartSlice.cartItemRemoveStatus;

// =============================
export const {
    resetCartItemAddStatus,
    resetCartItemRemoveStatus
} = cartSlice.actions;

export default cartSlice.reducer;
