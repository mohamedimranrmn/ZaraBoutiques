import { axiosi } from "../../config/axios";

/* ----------------------------------------------------------
   Helper: Build query string safely
---------------------------------------------------------- */
const buildQuery = (filters = {}) => {
    const params = new URLSearchParams();

    // Search
    if (filters.search) params.append("search", filters.search);

    // Brands (array)
    if (Array.isArray(filters.brand) && filters.brand.length > 0) {
        filters.brand.forEach(b => params.append("brand", b));
    }

    // Categories (array)
    if (Array.isArray(filters.category) && filters.category.length > 0) {
        filters.category.forEach(c => params.append("category", c));
    }

    // Pagination
    if (filters.pagination) {
        params.append("page", filters.pagination.page);
        params.append("limit", filters.pagination.limit);
    }

    // Sorting
    if (filters.sort) {
        params.append("sort", filters.sort.sort);
        params.append("order", filters.sort.order);
    }

    // Frontend requesting user
    if (filters.user) params.append("user", filters.user);

    // Deleted filter (admin)
    if (filters.isDeleted !== undefined) {
        params.append("isDeleted", filters.isDeleted);
    }

    return params.toString();
};

/* ----------------------------------------------------------
   ADD PRODUCT
---------------------------------------------------------- */
export const addProduct = async (data) => {
    try {
        const res = await axiosi.post("/products", data);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   FETCH PRODUCTS (with full filter support)
---------------------------------------------------------- */
export const fetchProducts = async (filters = {}) => {
    try {
        const queryString = buildQuery(filters);
        const res = await axiosi.get(`/products?${queryString}`);

        // Read total count header (case insensitive)
        const headers = res.headers;
        const totalHeader =
            headers["x-total-count"] ||
            headers["X-Total-Count"] ||
            headers["X-TOTAL-COUNT"] ||
            headers["x-Total-Count"];

        let totalResults = totalHeader ? parseInt(totalHeader, 10) : null;

        // Intelligent fallback when header is missing
        if (!totalResults || totalResults === 0) {
            const page = filters.pagination?.page || 1;
            const limit = filters.pagination?.limit || 12;
            const count = res.data.length;

            if (count === limit) totalResults = page * limit;
            else if (page === 1) totalResults = count;
            else totalResults = (page - 1) * limit + count;
        }

        return { data: res.data, totalResults };
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   FETCH PRODUCT BY ID
---------------------------------------------------------- */
export const fetchProductById = async (id) => {
    try {
        const res = await axiosi.get(`/products/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   UPDATE PRODUCT
---------------------------------------------------------- */
export const updateProductById = async (update) => {
    try {
        const res = await axiosi.patch(`/products/${update._id}`, update);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   UNDELETE PRODUCT
---------------------------------------------------------- */
export const undeleteProductById = async (id) => {
    try {
        const res = await axiosi.patch(`/products/undelete/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   SOFT DELETE PRODUCT
---------------------------------------------------------- */
export const deleteProductById = async (id) => {
    try {
        const res = await axiosi.delete(`/products/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   FORCE DELETE (ADMIN)
---------------------------------------------------------- */
export const forceDeleteProductById = async (id) => {
    try {
        const res = await axiosi.delete(`/products/force/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/* ----------------------------------------------------------
   LIVE STOCK (Optional feature)
---------------------------------------------------------- */
export const fetchProductStock = async (id) => {
    try {
        const res = await axiosi.get(`/products/stock/${id}`);
        return res.data; // { stockQuantity: number }
    } catch (error) {
        throw error.response?.data || error;
    }
};
