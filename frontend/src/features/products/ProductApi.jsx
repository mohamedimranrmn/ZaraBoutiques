import { axiosi } from "../../config/axios";

export const addProduct = async (data) => {
    try {
        const res = await axiosi.post('/products', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const fetchProducts = async (filters) => {
    let queryString = '';

    // SEARCH support
    if (filters.search) {
        queryString += `search=${filters.search}&`;
    }

    // Brand filter
    if (filters.brand) {
        filters.brand.forEach((brand) => {
            queryString += `brand=${brand}&`;
        });
    }

    // Category filter
    if (filters.category) {
        filters.category.forEach((category) => {
            queryString += `category=${category}&`;
        });
    }

    // Pagination
    if (filters.pagination) {
        queryString += `page=${filters.pagination.page}&limit=${filters.pagination.limit}&`;
    }

    // Sort
    if (filters.sort) {
        queryString += `sort=${filters.sort.sort}&order=${filters.sort.order}&`;
    }

    // Frontend user check
    if (filters.user) {
        queryString += `user=${filters.user}&`;
    }

    // isDeleted filter (admin)
    if (filters.isDeleted !== undefined) {
        queryString += `isDeleted=${filters.isDeleted}&`;
    }

    try {
        const res = await axiosi.get(`/products?${queryString}`);

        // Try multiple header variations (case-insensitive)
        const headers = res.headers;
        let totalResultsHeader =
            headers["x-total-count"] ||
            headers["X-Total-Count"] ||
            headers["X-TOTAL-COUNT"] ||
            headers["x-Total-Count"];

        let totalResults = totalResultsHeader ? parseInt(totalResultsHeader, 10) : null;

        // If header is missing and we got exactly ITEMS_PER_PAGE items, estimate there are more pages
        if (!totalResults && res.data.length === (filters.pagination?.limit || 12)) {
            // Estimate: if we got a full page, assume there are more pages
            totalResults = res.data.length * 10; // Conservative estimate
        } else if (!totalResults) {
            totalResults = res.data.length;
        }

        console.log('📊 API Response Debug:', {
            dataLength: res.data.length,
            headerValue: totalResultsHeader,
            parsedTotal: totalResults,
            allHeaders: headers
        });

        return { data: res.data, totalResults };
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const fetchProductById = async (id) => {
    try {
        const res = await axiosi.get(`/products/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const updateProductById = async (update) => {
    try {
        const res = await axiosi.patch(`/products/${update._id}`, update)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const undeleteProductById = async (id) => {
    try {
        const res = await axiosi.patch(`/products/undelete/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const deleteProductById = async (id) => {
    try {
        const res = await axiosi.delete(`/products/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

// Force delete product
export const forceDeleteProductById = async (id) => {
    try {
        const res = await axiosi.delete(`/products/force/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

// NEW: Fetch live stock for a product
export const fetchProductStock = async (id) => {
    try {
        const res = await axiosi.get(`/products/stock/${id}`)
        return res.data   // { stockQuantity: number }
    } catch (error) {
        throw error.response?.data || error
    }
}