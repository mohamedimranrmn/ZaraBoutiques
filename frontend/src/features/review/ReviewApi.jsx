import { axiosi } from "../../config/axios";

/**
 * Normalizes axios error so thunks never break
 */
const normalizeError = (error) => {
    if (error?.response?.data) return error.response.data;
    if (error?.response) return { message: "Server error", ...error.response };
    if (error?.request) return { message: "Network error – no response from server" };
    return { message: error?.message || "Unexpected error" };
};

/**
 * Ensures API always returns a predictable object:
 * { success: boolean, data: any, message?: string }
 */
const safeReturn = (res) => {
    if (res?.data !== undefined) return res.data;
    return { success: true, data: res };
};

/* ---------------------------------------------------------------------- */
/*                                API CALLS                               */
/* ---------------------------------------------------------------------- */

/* CREATE REVIEW */
export const createReview = async (review) => {
    try {
        const res = await axiosi.post("/reviews", review);
        return safeReturn(res);
    } catch (error) {
        throw normalizeError(error);
    }
};

/* FETCH REVIEWS FOR A PRODUCT */
export const fetchReviewsByProductId = async (id) => {
    try {
        const res = await axiosi.get(`/reviews/product/${id}`);
        return safeReturn(res);
    } catch (error) {
        throw normalizeError(error);
    }
};

/* UPDATE REVIEW */
export const updateReviewById = async (update) => {
    try {
        const res = await axiosi.patch(`/reviews/${update._id}`, update);
        return safeReturn(res);
    } catch (error) {
        throw normalizeError(error);
    }
};

/* DELETE REVIEW */
export const deleteReviewById = async (id) => {
    try {
        const res = await axiosi.delete(`/reviews/${id}`);

        // Normalize delete so it *always* returns {_id}
        if (res?.data?._id) return { _id: res.data._id };
        return { _id: id };
    } catch (error) {
        throw normalizeError(error);
    }
};
