import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchAllCategories } from './CategoriesApi';

const initialState = {
    status: "idle",
    categories: [],
    errors: null
};

export const fetchAllCategoriesAsync = createAsyncThunk(
    'categories/fetchAllCategoriesAsync',
    async () => {
        const categories = await fetchAllCategories();
        return categories;
    }
);

const categorySlice = createSlice({
    name: "categorySlice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllCategoriesAsync.pending, (state) => {
                state.status = 'pending';
            })
            .addCase(fetchAllCategoriesAsync.fulfilled, (state, action) => {
                state.status = 'fulfilled';
                state.categories = action.payload;
            })
            .addCase(fetchAllCategoriesAsync.rejected, (state, action) => {
                state.status = 'rejected';
                state.errors = action.error;
            });
    }
});

export const selectCategoryStatus = (state) => state.CategoriesSlice.status;
export const selectCategories = (state) => state.CategoriesSlice.categories;
export const selectCategoryErrors = (state) => state.CategoriesSlice.errors;

export default categorySlice.reducer;
