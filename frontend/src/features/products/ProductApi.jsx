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

        // Get total count from header (case-insensitive)
        const headers = res.headers;
        let totalResultsHeader =
            headers["x-total-count"] ||
            headers["X-Total-Count"] ||
            headers["X-TOTAL-COUNT"] ||
            headers["x-Total-Count"];

        // Parse the header value - this is the CORRECT total count from backend
        let totalResults = totalResultsHeader ? parseInt(totalResultsHeader, 10) : null;

        console.log('📊 API Response Debug:', {
            dataLength: res.data.length,
            headerValue: totalResultsHeader,
            parsedTotal: totalResults,
            allHeaders: Object.keys(headers),
            page: filters.pagination?.page,
            limit: filters.pagination?.limit
        });

        // Fallback: if header is missing, use intelligent estimation
        if (!totalResults || totalResults === 0) {
            console.warn('⚠️ X-Total-Count header missing or zero. Using estimation.');

            const currentPage = filters.pagination?.page || 1;
            const pageSize = filters.pagination?.limit || 12;
            const itemsOnCurrentPage = res.data.length;

            if (itemsOnCurrentPage === pageSize) {
                // Full page = there might be more pages
                // Estimate: at least current page worth of items
                totalResults = currentPage * pageSize;
            } else if (itemsOnCurrentPage < pageSize && currentPage === 1) {
                // First page not full = this is all the data
                totalResults = itemsOnCurrentPage;
            } else {
                // Partial last page = calculate total
                totalResults = (currentPage - 1) * pageSize + itemsOnCurrentPage;
            }

            console.log('🔢 Estimated totalResults:', totalResults);
        }

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