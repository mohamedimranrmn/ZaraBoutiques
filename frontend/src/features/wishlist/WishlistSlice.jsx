// features/wishlist/WishlistSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    createWishlistItem,
    deleteWishlistItemById,
    fetchWishlistByUserId,
    updateWishlistItemById
} from './WishlistApi';

const initialState = {
    wishlistItemUpdateStatus: "idle",
    wishlistItemAddStatus: "idle",
    wishlistItemDeleteStatus: "idle",
    wishlistFetchStatus: "idle",
    items: [],
    totalResults: 0,
    errors: null,
    successMessage: null
};

// =============================
// ASYNC THUNKS
// =============================
export const createWishlistItemAsync = createAsyncThunk(
    'wishlist/createWishlistItemAsync',
    async (data, { rejectWithValue }) => {
        try {
            return await createWishlistItem(data);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchWishlistByUserIdAsync = createAsyncThunk(
    'wishlist/fetchWishlistByUserIdAsync',
    async (id, { rejectWithValue }) => {
        try {
            return await fetchWishlistByUserId(id);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const updateWishlistItemByIdAsync = createAsyncThunk(
    'wishlist/updateWishlistItemByIdAsync',
    async (update, { rejectWithValue }) => {
        try {
            return await updateWishlistItemById(update);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const deleteWishlistItemByIdAsync = createAsyncThunk(
    'wishlist/deleteWishlistItemByIdAsync',
    async (id, { rejectWithValue }) => {
        try {
            return await deleteWishlistItemById(id);
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// =============================
// SLICE
// =============================
const wishlistSlice = createSlice({
    name: "WishlistSlice",
    initialState,
    reducers: {
        resetWishlistItemUpdateStatus: (state) => {
            state.wishlistItemUpdateStatus = "idle";
        },
        resetWishlistItemAddStatus: (state) => {
            state.wishlistItemAddStatus = "idle";
        },
        resetWishlistItemDeleteStatus: (state) => {
            state.wishlistItemDeleteStatus = "idle";
        },
        resetWishlistFetchStatus: (state) => {
            state.wishlistFetchStatus = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            // CREATE
            .addCase(createWishlistItemAsync.pending, (state) => {
                state.wishlistItemAddStatus = "pending";
            })
            .addCase(createWishlistItemAsync.fulfilled, (state, action) => {
                state.wishlistItemAddStatus = "fulfilled";
                state.items.push(action.payload);
            })
            .addCase(createWishlistItemAsync.rejected, (state, action) => {
                state.wishlistItemAddStatus = "rejected";
                state.errors = action.payload;
            })

            // FETCH - ✅ FIXED: Handle direct array response with safety
            .addCase(fetchWishlistByUserIdAsync.pending, (state) => {
                state.wishlistFetchStatus = "pending";
            })
            .addCase(fetchWishlistByUserIdAsync.fulfilled, (state, action) => {
                state.wishlistFetchStatus = "fulfilled";

                // ✅ FIXED: Backend returns direct array, ensure it's always an array
                if (Array.isArray(action.payload)) {
                    state.items = action.payload;
                    state.totalResults = action.payload.length;
                } else if (action.payload && Array.isArray(action.payload.data)) {
                    // Fallback: handle wrapped format if backend returns { data: [...] }
                    state.items = action.payload.data;
                    state.totalResults = action.payload.totalResults || action.payload.data.length;
                } else {
                    // Safety fallback: empty array
                    state.items = [];
                    state.totalResults = 0;
                }
            })
            .addCase(fetchWishlistByUserIdAsync.rejected, (state, action) => {
                state.wishlistFetchStatus = "rejected";
                state.errors = action.payload;
                // ✅ Safety: ensure items is always an array even on error
                state.items = [];
                state.totalResults = 0;
            })

            // UPDATE
            .addCase(updateWishlistItemByIdAsync.pending, (state) => {
                state.wishlistItemUpdateStatus = "pending";
            })
            .addCase(updateWishlistItemByIdAsync.fulfilled, (state, action) => {
                state.wishlistItemUpdateStatus = "fulfilled";

                const updated = action.payload;
                const index = state.items.findIndex((i) => i._id === updated._id);

                if (index !== -1) {
                    state.items[index] = updated;
                }
            })
            .addCase(updateWishlistItemByIdAsync.rejected, (state, action) => {
                state.wishlistItemUpdateStatus = "rejected";
                state.errors = action.payload;
            })

            // DELETE
            .addCase(deleteWishlistItemByIdAsync.pending, (state) => {
                state.wishlistItemDeleteStatus = "pending";
            })
            .addCase(deleteWishlistItemByIdAsync.fulfilled, (state, action) => {
                state.wishlistItemDeleteStatus = "fulfilled";

                const deleted = action.payload;
                if (deleted && deleted._id) {
                    state.items = state.items.filter((i) => i._id !== deleted._id);
                }
            })
            .addCase(deleteWishlistItemByIdAsync.rejected, (state, action) => {
                state.wishlistItemDeleteStatus = "rejected";
                state.errors = action.payload;
            });
    }
});

// =============================
// SELECTORS
// =============================
export const selectWishlistItems = (state) => state.WishlistSlice.items;
export const selectWishlistFetchStatus = (state) => state.WishlistSlice.wishlistFetchStatus;
export const selectWishlistItemUpdateStatus = (state) => state.WishlistSlice.wishlistItemUpdateStatus;
export const selectWishlistItemAddStatus = (state) => state.WishlistSlice.wishlistItemAddStatus;
export const selectWishlistItemDeleteStatus = (state) => state.WishlistSlice.wishlistItemDeleteStatus;
export const selectWishlistErrors = (state) => state.WishlistSlice.errors;
export const selectWishlistSuccessMessage = (state) => state.WishlistSlice.successMessage;
export const selectWishlistTotalResults = (state) => state.WishlistSlice.totalResults;

// =============================
// ACTIONS
// =============================
export const {
    resetWishlistFetchStatus,
    resetWishlistItemAddStatus,
    resetWishlistItemDeleteStatus,
    resetWishlistItemUpdateStatus
} = wishlistSlice.actions;

export default wishlistSlice.reducer;