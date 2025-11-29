import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    addAddress,
    deleteAddressById,
    fetchAddressByUserId,
    updateAddressById,
} from "./AddressApi";

const initialState = {
    status: "idle",
    addressAddStatus: "idle",
    addressDeleteStatus: "idle",
    addressUpdateStatus: "idle",
    addresses: [],
    errors: null,
    successMessage: null,
};

/* ================================
    THUNKS
================================ */

export const addAddressAsync = createAsyncThunk(
    "address/addAddressAsync",
    async (address) => await addAddress(address)
);

export const fetchAddressByUserIdAsync = createAsyncThunk(
    "address/fetchAddressByUserIdAsync",
    async (id) => await fetchAddressByUserId(id)
);

// ✅ FIXED — now receives update object, not id
export const updateAddressByIdAsync = createAsyncThunk(
    "address/updateAddressByIdAsync",
    async (update) => await updateAddressById(update)
);

export const deleteAddressByIdAsync = createAsyncThunk(
    "address/deleteAddressByIdAsync",
    async (id) => await deleteAddressById(id)
);

/* ================================
    SLICE
================================ */

const addressSlice = createSlice({
    name: "AddressSlice",
    initialState,
    reducers: {
        resetAddressStatus: (state) => {
            state.status = "idle";
        },
        resetAddressAddStatus: (state) => {
            state.addressAddStatus = "idle";
        },
        resetAddressDeleteStatus: (state) => {
            state.addressDeleteStatus = "idle";
        },
        resetAddressUpdateStatus: (state) => {
            state.addressUpdateStatus = "idle";
        },
    },
    extraReducers: (builder) => {
        builder

            // ADD ADDRESS
            .addCase(addAddressAsync.pending, (state) => {
                state.addressAddStatus = "pending";
            })
            .addCase(addAddressAsync.fulfilled, (state, action) => {
                state.addressAddStatus = "fulfilled";
                state.addresses.push(action.payload);
            })
            .addCase(addAddressAsync.rejected, (state, action) => {
                state.addressAddStatus = "rejected";
                state.errors = action.error;
            })

            // FETCH ALL OF USER
            .addCase(fetchAddressByUserIdAsync.pending, (state) => {
                state.status = "pending";
            })
            .addCase(fetchAddressByUserIdAsync.fulfilled, (state, action) => {
                state.status = "fulfilled";
                state.addresses = action.payload;
            })
            .addCase(fetchAddressByUserIdAsync.rejected, (state, action) => {
                state.status = "rejected";
                state.errors = action.error;
            })

            // UPDATE
            .addCase(updateAddressByIdAsync.pending, (state) => {
                state.addressUpdateStatus = "pending";
            })
            .addCase(updateAddressByIdAsync.fulfilled, (state, action) => {
                state.addressUpdateStatus = "fulfilled";

                const index = state.addresses.findIndex(
                    (a) => a._id === action.payload._id
                );
                if (index !== -1) {
                    state.addresses[index] = action.payload;
                }
            })
            .addCase(updateAddressByIdAsync.rejected, (state, action) => {
                state.addressUpdateStatus = "rejected";
                state.errors = action.error;
            })

            // DELETE
            .addCase(deleteAddressByIdAsync.pending, (state) => {
                state.addressDeleteStatus = "pending";
            })
            .addCase(deleteAddressByIdAsync.fulfilled, (state, action) => {
                state.addressDeleteStatus = "fulfilled";
                state.addresses = state.addresses.filter(
                    (a) => a._id !== action.payload._id
                );
            })
            .addCase(deleteAddressByIdAsync.rejected, (state, action) => {
                state.addressDeleteStatus = "rejected";
                state.errors = action.error;
            });
    },
});

/* ================================
    SELECTORS
================================ */

export const selectAddressStatus = (state) => state.AddressSlice.status;
export const selectAddresses = (state) => state.AddressSlice.addresses;
export const selectAddressErrors = (state) => state.AddressSlice.errors;
export const selectAddressSuccessMessage = (state) =>
    state.AddressSlice.successMessage;

export const selectAddressAddStatus = (state) =>
    state.AddressSlice.addressAddStatus;

export const selectAddressDeleteStatus = (state) =>
    state.AddressSlice.addressDeleteStatus;

export const selectAddressUpdateStatus = (state) =>
    state.AddressSlice.addressUpdateStatus;

/* ================================
    ACTIONS
================================ */

export const {
    resetAddressStatus,
    resetAddressAddStatus,
    resetAddressDeleteStatus,
    resetAddressUpdateStatus,
} = addressSlice.actions;

export default addressSlice.reducer;
