import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchAllBrands } from './BrandApi';

const initialState = {
    status: "idle",
    brands: [],
    errors: null
};

export const fetchAllBrandsAsync = createAsyncThunk(
    'brands/fetchAllBrandsAsync',
    async () => {
        const brands = await fetchAllBrands();
        return brands;
    }
);

const brandSlice = createSlice({
    name: "brandSlice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllBrandsAsync.pending, (state) => {
                state.status = 'pending';
            })
            .addCase(fetchAllBrandsAsync.fulfilled, (state, action) => {
                state.status = 'fulfilled';
                state.brands = action.payload;
            })
            .addCase(fetchAllBrandsAsync.rejected, (state, action) => {
                state.status = 'rejected';
                state.errors = action.error;
            });
    }
});

export const selectBrandStatus = (state) => state.BrandSlice.status;
export const selectBrands = (state) => state.BrandSlice.brands;
export const selectBrandErrors = (state) => state.BrandSlice.errors;

export default brandSlice.reducer;
