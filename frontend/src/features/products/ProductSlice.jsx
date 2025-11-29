import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    addProduct,
    deleteProductById,
    fetchProductById,
    fetchProducts,
    undeleteProductById,
    updateProductById,
    forceDeleteProductById
} from "./ProductApi";
import { axiosi } from "../../config/axios";

const initialState = {
    status: "idle",
    productUpdateStatus: "idle",
    productAddStatus: "idle",
    productFetchStatus: "idle",
    products: [],
    totalResults: 0,
    isFilterOpen: false,
    selectedProduct: null,
    errors: null,
    successMessage: null,
    stats: { total: 0, active: 0, deleted: 0 },
    statsStatus: "idle",
};

/* ============================================
   THUNKS
============================================ */

export const fetchProductStatsAsync = createAsyncThunk(
    "products/fetchStats",
    async () => {
        const res = await axiosi.get("/products/stats");
        return res.data;
    }
);

export const addProductAsync = createAsyncThunk(
    "products/addProductAsync",
    async (data) => await addProduct(data)
);

export const fetchProductsAsync = createAsyncThunk(
    "products/fetchProductsAsync",
    async (filters) => await fetchProducts(filters)
);

export const fetchProductByIdAsync = createAsyncThunk(
    "products/fetchProductByIdAsync",
    async (id) => await fetchProductById(id)
);

export const updateProductByIdAsync = createAsyncThunk(
    "products/updateProductByIdAsync",
    async (update) => await updateProductById(update)
);

export const undeleteProductByIdAsync = createAsyncThunk(
    "products/undeleteProductByIdAsync",
    async (id) => await undeleteProductById(id)
);

export const deleteProductByIdAsync = createAsyncThunk(
    "products/deleteProductByIdAsync",
    async (id) => await deleteProductById(id)
);

export const forceDeleteProductByIdAsync = createAsyncThunk(
    "products/forceDeleteProductByIdAsync",
    async (id) => await forceDeleteProductById(id)
);

/* ============================================
   SLICE
============================================ */

const productSlice = createSlice({
    name: "ProductSlice",
    initialState,
    reducers: {
        clearProductErrors: (state) => { state.errors = null },
        clearProductSuccessMessage: (state) => { state.successMessage = null },
        resetProductStatus: (state) => { state.status = "idle" },
        clearSelectedProduct: (state) => { state.selectedProduct = null },
        resetProductUpdateStatus: (state) => { state.productUpdateStatus = "idle" },
        resetProductAddStatus: (state) => { state.productAddStatus = "idle" },
        toggleFilters: (state) => { state.isFilterOpen = !state.isFilterOpen },
        resetProductFetchStatus: (state) => { state.productFetchStatus = "idle" }
    },

    extraReducers: (builder) => {
        builder

            /* ---------------- ADD PRODUCT ---------------- */
            .addCase(addProductAsync.pending, (state) => {
                state.productAddStatus = "pending";
            })
            .addCase(addProductAsync.fulfilled, (state, action) => {
                state.productAddStatus = "fulfilled";
                state.products.push(action.payload);
            })
            .addCase(addProductAsync.rejected, (state, action) => {
                state.productAddStatus = "rejected";
                state.errors = action.error;
            })

            /* ---------------- FETCH PRODUCTS ---------------- */
            .addCase(fetchProductsAsync.pending, (state) => {
                state.productFetchStatus = "pending";
            })
            .addCase(fetchProductsAsync.fulfilled, (state, action) => {
                state.productFetchStatus = "fulfilled";
                state.products = action.payload.data;
                state.totalResults = action.payload.totalResults;
            })
            .addCase(fetchProductsAsync.rejected, (state, action) => {
                state.productFetchStatus = "rejected";
                state.errors = action.error;
            })

            /* ---------------- FETCH BY ID ---------------- */
            .addCase(fetchProductByIdAsync.pending, (state) => {
                state.productFetchStatus = "pending";
            })
            .addCase(fetchProductByIdAsync.fulfilled, (state, action) => {
                state.productFetchStatus = "fulfilled";
                state.selectedProduct = action.payload;
            })
            .addCase(fetchProductByIdAsync.rejected, (state, action) => {
                state.productFetchStatus = "rejected";
                state.errors = action.error;
            })

            /* ---------------- UPDATE PRODUCT ---------------- */
            .addCase(updateProductByIdAsync.pending, (state) => {
                state.productUpdateStatus = "pending";
            })
            .addCase(updateProductByIdAsync.fulfilled, (state, action) => {
                state.productUpdateStatus = "fulfilled";
                const index = state.products.findIndex(
                    (p) => p._id === action.payload._id
                );
                if (index !== -1) state.products[index] = action.payload;
            })
            .addCase(updateProductByIdAsync.rejected, (state, action) => {
                state.productUpdateStatus = "rejected";
                state.errors = action.error;
            })

            /* ---------------- UNDELETE PRODUCT ---------------- */
            .addCase(undeleteProductByIdAsync.pending, (state) => {
                state.productUpdateStatus = "pending";
            })
            .addCase(undeleteProductByIdAsync.fulfilled, (state, action) => {
                state.productUpdateStatus = "fulfilled";
                const index = state.products.findIndex(
                    (p) => p._id === action.payload._id
                );
                if (index !== -1) state.products[index] = action.payload;
            })
            .addCase(undeleteProductByIdAsync.rejected, (state, action) => {
                state.productUpdateStatus = "rejected";
                state.errors = action.error;
            })

            /* ---------------- SOFT DELETE PRODUCT ---------------- */
            .addCase(deleteProductByIdAsync.pending, (state) => {
                state.productUpdateStatus = "pending";
            })
            .addCase(deleteProductByIdAsync.fulfilled, (state, action) => {
                state.productUpdateStatus = "fulfilled";
                const index = state.products.findIndex(
                    (p) => p._id === action.payload._id
                );
                if (index !== -1) state.products[index] = action.payload;
            })
            .addCase(deleteProductByIdAsync.rejected, (state, action) => {
                state.productUpdateStatus = "rejected";
                state.errors = action.error;
            })

            /* ---------------- PRODUCT STATS ---------------- */
            .addCase(fetchProductStatsAsync.pending, (state) => {
                state.statsStatus = "pending";
            })
            .addCase(fetchProductStatsAsync.fulfilled, (state, action) => {
                state.statsStatus = "fulfilled";
                state.stats = action.payload;
            })
            .addCase(fetchProductStatsAsync.rejected, (state) => {
                state.statsStatus = "rejected";
            })

            /* ---------------- FORCE DELETE PRODUCT ---------------- */
            .addCase(forceDeleteProductByIdAsync.pending, (state) => {
                state.status = "pending";
            })
            .addCase(forceDeleteProductByIdAsync.fulfilled, (state, action) => {
                state.status = "fulfilled";
                state.products = state.products.filter(
                    (p) => p._id !== action.payload._id
                );
                state.totalResults -= 1;
            })
            .addCase(forceDeleteProductByIdAsync.rejected, (state, action) => {
                state.status = "rejected";
                state.errors = action.error;
            });
    }
});

/* ============================================
   SELECTORS
============================================ */

export const selectProductStats = (state) => state.ProductSlice.stats;
export const selectProductStatus = (state) => state.ProductSlice.status;
export const selectProducts = (state) => state.ProductSlice.products;
export const selectProductTotalResults = (state) => state.ProductSlice.totalResults;
export const selectSelectedProduct = (state) => state.ProductSlice.selectedProduct;
export const selectProductErrors = (state) => state.ProductSlice.errors;
export const selectProductSuccessMessage = (state) => state.ProductSlice.successMessage;
export const selectProductUpdateStatus = (state) => state.ProductSlice.productUpdateStatus;
export const selectProductAddStatus = (state) => state.ProductSlice.productAddStatus;
export const selectProductIsFilterOpen = (state) => state.ProductSlice.isFilterOpen;
export const selectProductFetchStatus = (state) => state.ProductSlice.productFetchStatus;

/* ============================================
   ACTIONS
============================================ */

export const {
    clearProductSuccessMessage,
    clearProductErrors,
    clearSelectedProduct,
    resetProductStatus,
    resetProductUpdateStatus,
    resetProductAddStatus,
    toggleFilters,
    resetProductFetchStatus
} = productSlice.actions;

export default productSlice.reducer;
