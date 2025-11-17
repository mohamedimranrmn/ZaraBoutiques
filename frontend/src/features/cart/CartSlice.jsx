import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
    addToCart,
    fetchCartByUserId,
    updateCartItemById,
    deleteCartItemById,
    resetCartByUserId
} from './CartApi'

const initialState = {
    status: "idle",
    items: [],
    cartItemAddStatus: "idle",
    cartItemRemoveStatus: "idle",
    errors: null
};

export const addToCartAsync = createAsyncThunk(
    'cart/addToCartAsync',
    async (item) => await addToCart(item)
);

export const fetchCartByUserIdAsync = createAsyncThunk(
    'cart/fetchCartByUserIdAsync',
    async (id) => await fetchCartByUserId(id)
);

export const updateCartItemByIdAsync = createAsyncThunk(
    'cart/updateCartItemByIdAsync',
    async (update) => await updateCartItemById(update)
);

export const deleteCartItemByIdAsync = createAsyncThunk(
    'cart/deleteCartItemByIdAsync',
    async (id) => await deleteCartItemById(id)
);

export const resetCartByUserIdAsync = createAsyncThunk(
    'cart/resetCartByUserIdAsync',
    async (userId) => await resetCartByUserId(userId)
);


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
                state.errors = action.error;
            })

            // FETCH CART
            .addCase(fetchCartByUserIdAsync.fulfilled, (state, action) => {
                state.status = 'fulfilled';
                state.items = action.payload;
            })

            // UPDATE CART (FIXED)
            .addCase(updateCartItemByIdAsync.fulfilled, (state, action) => {
                state.status = 'fulfilled';

                const updated = action.payload;

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

export const selectCartItems = (state) => state.CartSlice.items;
export const selectCartItemAddStatus = (state) => state.CartSlice.cartItemAddStatus;
export const selectCartItemRemoveStatus = (state) => state.CartSlice.cartItemRemoveStatus;

export const {
    resetCartItemAddStatus,
    resetCartItemRemoveStatus
} = cartSlice.actions;

export default cartSlice.reducer;