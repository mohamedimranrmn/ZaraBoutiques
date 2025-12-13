import React, { useEffect, useState } from "react";
import {
    Box,
    Stack,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    useTheme,
    useMediaQuery,
    Drawer,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button,
    Chip,
    TextField,
    InputAdornment,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";

import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import {
    fetchProductsAsync,
    selectProducts,
    selectProductTotalResults,
    selectProductFetchStatus,
    resetProductFetchStatus,
} from "../ProductSlice";

import { selectBrands } from "../../brands/BrandSlice";
import { selectCategories } from "../../categories/CategoriesSlice";
import { selectLoggedInUser } from "../../auth/AuthSlice";

import {
    createWishlistItemAsync,
    deleteWishlistItemByIdAsync,
    selectWishlistItems,
    selectWishlistItemAddStatus,
    selectWishlistItemDeleteStatus,
    resetWishlistItemAddStatus,
    resetWishlistItemDeleteStatus,
} from "../../wishlist/WishlistSlice";

import { selectCartItemAddStatus, resetCartItemAddStatus } from "../../cart/CartSlice";

import { toast } from "react-toastify";
import { ProductCard } from "./ProductCard";

import Lottie from "lottie-react";
import NotFoundSearch from "../../../assets/animations/NotFoundSearch.json";


import { ITEMS_PER_PAGE } from "../../../constants/index";

/* Sort options */
const sortOptions = [
    { name: "Price: low to high", sort: "price", order: "asc", value: "price-asc" },
    { name: "Price: high to low", sort: "price", order: "desc", value: "price-desc" },
];

/* Skeleton card for loading */
const ProductCardSkeleton = () => (
    <Stack spacing={1} sx={{ width: "100%", maxWidth: 340, p: 1 }}>
        <Box sx={{ width: "100%", aspectRatio: "1/1", bgcolor: "grey.100", borderRadius: 2 }} />
        <Box sx={{ height: 16, bgcolor: "grey.100", width: "60%" }} />
        <Box sx={{ height: 14, bgcolor: "grey.100", width: "40%" }} />
    </Stack>
);

const ModernPagination = ({ currentPage, totalPages, onPageChange }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const delta = isMobile ? 1 : 2;

        pages.push(1);

        let rangeStart = Math.max(2, currentPage - delta);
        let rangeEnd = Math.min(totalPages - 1, currentPage + delta);

        if (rangeStart > 2) {
            pages.push("ellipsis-start");
        }

        for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.push(i);
        }

        if (rangeEnd < totalPages - 1) pages.push("ellipsis-end");

        if (totalPages > 1) pages.push(totalPages);

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 3 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                    size="small"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    sx={{
                        width: 32,
                        height: 32,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:disabled': { opacity: 0.4 }
                    }}
                >
                    <ChevronLeftIcon fontSize="small" />
                </IconButton>

                {pageNumbers.map((page) =>
                    typeof page === "string" ? (
                        <Typography key={page} sx={{ px: 0.5, color: 'text.secondary' }}>...</Typography>
                    ) : (
                        <Box
                            key={page}
                            onClick={() => onPageChange(page)}
                            sx={{
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid',
                                borderColor: page === currentPage ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                bgcolor: page === currentPage ? 'primary.main' : 'transparent',
                                color: page === currentPage ? 'white' : 'text.primary',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: page === currentPage ? 600 : 400,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: page === currentPage ? 'primary.dark' : 'action.hover',
                                    borderColor: page === currentPage ? 'primary.dark' : 'text.secondary',
                                }
                            }}
                        >
                            {page}
                        </Box>
                    )
                )}

                <IconButton
                    size="small"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    sx={{
                        width: 32,
                        height: 32,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:disabled': { opacity: 0.4 }
                    }}
                >
                    <ChevronRightIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    );
};


export const ProductList = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [searchParams, setSearchParams] = useSearchParams();

    const products = useSelector(selectProducts);
    const totalResults = useSelector(selectProductTotalResults);
    const fetchStatus = useSelector(selectProductFetchStatus);

    const brands = useSelector(selectBrands);
    const categories = useSelector(selectCategories);
    const wishlistItems = useSelector(selectWishlistItems);

    const wishlistAddStatus = useSelector(selectWishlistItemAddStatus);
    const wishlistDeleteStatus = useSelector(selectWishlistItemDeleteStatus);
    const cartAddStatus = useSelector(selectCartItemAddStatus);
    const loggedInUser = useSelector(selectLoggedInUser);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState("");
    const [debouncedMobileSearch, setDebouncedMobileSearch] = useState("");

    /* URL params */
    const urlSearch = searchParams.get("search") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlPage = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const urlBrands = searchParams.get("brands")?.split(",").filter(Boolean) || [];
    const urlCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];

    const [selectedBrands, setSelectedBrands] = useState(urlBrands);
    const [selectedCategories, setSelectedCategories] = useState(urlCategories);

    const startIndex = (urlPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(urlPage * ITEMS_PER_PAGE, totalResults);

    /* Debounce mobile search */
    useEffect(() => {
        if (!isMobile) return;
        const t = setTimeout(() => {
            setDebouncedMobileSearch(mobileSearchQuery);
            const params = new URLSearchParams(searchParams);
            if (mobileSearchQuery.trim()) params.set("search", mobileSearchQuery.trim());
            else params.delete("search");
            params.delete("page");
            setSearchParams(params);
        }, 400);
        return () => clearTimeout(t);
    }, [mobileSearchQuery, isMobile]);

    /* Sync local filter checkboxes with URL changes */
    useEffect(() => {
        setSelectedBrands(urlBrands);
        setSelectedCategories(urlCategories);
    }, [urlBrands.join(","), urlCategories.join(",")]);

    /* Fetch products when URL params change */
    useEffect(() => {
        const filters = {};
        if (urlBrands.length > 0) filters.brand = urlBrands;
        if (urlCategories.length > 0) filters.category = urlCategories;

        let sort = null;
        if (urlSort === "price-asc") sort = { sort: "price", order: "asc" };
        if (urlSort === "price-desc") sort = { sort: "price", order: "desc" };

        const searchTerm = isMobile ? debouncedMobileSearch : urlSearch;

        const payload = {
            ...filters,
            pagination: { page: urlPage, limit: ITEMS_PER_PAGE },
            sort,
        };
        if (searchTerm.trim()) payload.search = searchTerm.trim();
        if (!loggedInUser?.isAdmin) payload.user = true;

        dispatch(fetchProductsAsync(payload));
    }, [urlSearch, urlSort, urlPage, urlBrands.join(","), urlCategories.join(","), debouncedMobileSearch]);

    /* Toasts for wishlist / cart */
    useEffect(() => {
        if (wishlistAddStatus === "fulfilled") {
            toast.success("Added to wishlist");
            dispatch(resetWishlistItemAddStatus());
        }
        if (wishlistDeleteStatus === "fulfilled") {
            toast.success("Removed from wishlist");
            dispatch(resetWishlistItemDeleteStatus());
        }
        if (cartAddStatus === "fulfilled") {
            toast.success("Added to cart");
            dispatch(resetCartItemAddStatus());
        }
    }, [wishlistAddStatus, wishlistDeleteStatus, cartAddStatus]);

    useEffect(() => {
        return () => dispatch(resetProductFetchStatus());
    }, [dispatch]);

    const visibleProducts = products.filter((p) => !p.isDeleted);
    const totalPages = Math.max(1, Math.ceil((totalResults || 0) / ITEMS_PER_PAGE));

    const handlePageChange = (page) => {
        const newPage = Math.max(1, Math.min(page, totalPages));
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBrand = (e) => {
        const id = e.target.value;
        const updated = e.target.checked ? [...selectedBrands, id] : selectedBrands.filter((b) => b !== id);
        setSelectedBrands(updated);
    };

    const handleCategory = (e) => {
        const id = e.target.value;
        const updated = e.target.checked ? [...selectedCategories, id] : selectedCategories.filter((c) => c !== id);
        setSelectedCategories(updated);
    };

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams);
        if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
        else params.delete("brands");
        if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
        else params.delete("categories");
        params.delete("page");
        setSearchParams(params);
        setDrawerOpen(false);
    };

    const clearAllFilters = () => {
        setSelectedBrands([]);
        setSelectedCategories([]);
        const params = new URLSearchParams(searchParams);
        params.delete("brands");
        params.delete("categories");
        params.delete("page");
        setSearchParams(params);
        setDrawerOpen(false);
    };

    const handleClearMobileSearch = () => {
        setMobileSearchQuery("");
        setDebouncedMobileSearch("");
        const params = new URLSearchParams(searchParams);
        params.delete("search");
        params.delete("page");
        setSearchParams(params);
    };

    const handleSortChange = (e) => {
        const params = new URLSearchParams(searchParams);
        const v = e.target.value;
        if (v) params.set("sort", v);
        else params.delete("sort");
        params.delete("page");
        setSearchParams(params);
    };

    const handleWishlistToggle = (e, productId) => {
        if (e.target.checked) {
            dispatch(createWishlistItemAsync({ user: loggedInUser?._id, product: productId }));
        } else {
            const idx = wishlistItems.findIndex((i) => i.product._id === productId);
            if (idx !== -1) dispatch(deleteWishlistItemByIdAsync(wishlistItems[idx]._id));
        }
    };

    const activeFilterCount = selectedBrands.length + selectedCategories.length;
    const showNoResults = fetchStatus === "fulfilled" && visibleProducts.length === 0;

    return (
        <Box>
            {/* Desktop header */}
            {!isMobile && (
                <Box
                    sx={{
                        px: { xs: 2, sm: 2, md: 4 },
                        maxWidth: 1400,
                        mx: "auto",
                        mt: 2,
                        mb: 2,
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 3 }}
                    >
                        <Box /> {/* keeps alignment visually balanced */}

                        <Stack direction="row" spacing={2} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <SortIcon fontSize="small" />
                                        <span>Sort</span>
                                    </Stack>
                                </InputLabel>
                                <Select
                                    value={urlSort}
                                    label="Sort"
                                    onChange={handleSortChange}
                                    sx={{ "& fieldset": { borderColor: "divider !important" } }}
                                >
                                    <MenuItem value="">
                                        <em>Default</em>
                                    </MenuItem>
                                    {sortOptions.map((s) => (
                                        <MenuItem key={s.value} value={s.value}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ position: "relative" }}>
                                <Button
                                    variant={activeFilterCount > 0 ? "contained" : "outlined"}
                                    size="small"
                                    startIcon={<FilterListIcon />}
                                    onClick={() => setDrawerOpen(true)}
                                >
                                    Filter
                                </Button>
                                {activeFilterCount > 0 && (
                                    <Chip
                                        label={activeFilterCount}
                                        color="primary"
                                        size="small"
                                        sx={{ position: "absolute", top: -8, right: -8 }}
                                    />
                                )}
                            </Box>
                        </Stack>
                    </Stack>
                </Box>
            )}


            {/* Mobile search + controls */}
            {isMobile && (
                <Box sx={{ mt: 3, px: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search products, brands, categories..."
                            value={mobileSearchQuery}
                            onChange={(e) => setMobileSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                                endAdornment: mobileSearchQuery && (<InputAdornment position="end"><IconButton size="small" onClick={handleClearMobileSearch}><ClearIcon /></IconButton></InputAdornment>),
                            }}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.paper" } }}
                        />

                        <Stack direction="row" justifyContent="space-between">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Sort</InputLabel>
                                <Select label="Sort" value={urlSort} onChange={handleSortChange}>
                                    <MenuItem value=""><em>Default</em></MenuItem>
                                    {sortOptions.map((s) => (<MenuItem key={s.value} value={s.value}>{s.name}</MenuItem>))}
                                </Select>
                            </FormControl>

                            <Box sx={{ position: "relative" }}>
                                <Button variant={activeFilterCount > 0 ? "contained" : "outlined"} size="small" startIcon={<FilterListIcon />} onClick={() => setDrawerOpen(true)}>
                                    Filter
                                </Button>
                                {activeFilterCount > 0 && <Chip label={activeFilterCount} color="primary" size="small" sx={{ position: "absolute", top: -8, right: -8 }} />}
                            </Box>
                        </Stack>
                    </Stack>
                </Box>
            )}

            {/* Product grid */}
            <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, py: { xs: 2, sm: 3 }, mt: { xs: 2, md: 0 }, maxWidth: "1400px", mx: "auto" }}>
                {fetchStatus === "pending" ? (
                    <Grid container spacing={2}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Grid key={i} item xs={6} sm={4} md={3}><ProductCardSkeleton /></Grid>
                        ))}
                    </Grid>
                ) : showNoResults ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: "40vh" }}>
                        <Box sx={{ width: 260 }}><Lottie animationData={NotFoundSearch} loop /></Box>
                        <Typography variant="h6" fontWeight={700}>No products found</Typography>
                        {(urlSearch || activeFilterCount > 0) && (
                            <Button variant="outlined" sx={{ mt: 3 }} onClick={() => { setSelectedBrands([]); setSelectedCategories([]); setSearchParams({}); }}>
                                Clear All Filters
                            </Button>
                        )}
                    </Stack>
                ) : (
                    <>
                        <Grid container spacing={2}>
                            {visibleProducts.map((p) => (
                                <Grid key={p._id} item xs={6} sm={6} md={4} lg={3}>
                                    <ProductCard
                                        id={p._id}
                                        title={p.title}
                                        sizes={p.sizes}
                                        requiresSize={p.sizes?.length > 0}
                                        price={p.discountedPrice !== undefined ? p.discountedPrice : p.price}
                                        originalPrice={
                                            p.discountPercentage > 0
                                                ? p.price   // show MRP
                                                : null      // hide strike
                                        }
                                        discountPercentage={p.discountPercentage || 0}
                                        thumbnail={p.thumbnail}
                                        brand={p.brand?.name}
                                        stockQuantity={p.stockQuantity}
                                        handleAddRemoveFromWishlist={(e, id) => handleWishlistToggle(e, id)}
                                    />

                                </Grid>
                            ))}
                        </Grid>

                        {/* Modern Pagination */}
                        <ModernPagination
                            currentPage={urlPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />

                        {/* Product count below pagination - both mobile and desktop */}
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: "center",
                                fontWeight: 500,
                                mt: 2,
                            }}
                        >
                            {urlSearch && `Search results for "${urlSearch}" - `}
                            Showing {startIndex}–{endIndex} of {totalResults} products
                        </Typography>
                    </>
                )}
            </Box>

            {/* Filter drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: isMobile ? "88%" : 360, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, p: 2 } }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>Filters</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<AddIcon />}><Typography fontWeight={600}>Brands</Typography></AccordionSummary>
                    <AccordionDetails>
                        <FormGroup>
                            {brands.map((b) => (
                                <FormControlLabel key={b._id} control={<Checkbox value={b._id} checked={selectedBrands.includes(b._id)} onChange={handleBrand} />} label={b.name} />
                            ))}
                        </FormGroup>
                    </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 1 }} />

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<AddIcon />}><Typography fontWeight={600}>Categories</Typography></AccordionSummary>
                    <AccordionDetails>
                        <FormGroup>
                            {categories.map((c) => (
                                <FormControlLabel key={c._id} control={<Checkbox value={c._id} checked={selectedCategories.includes(c._id)} onChange={handleCategory} />} label={c.name} />
                            ))}
                        </FormGroup>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ mt: 2 }}>
                    <Button fullWidth variant="contained" onClick={applyFilters} sx={{ textTransform: "none", py: 1.2 }}>Apply Filters</Button>
                    <Button fullWidth variant="text" color="error" onClick={clearAllFilters} sx={{ textTransform: "none", mt: 1 }}>Clear All</Button>
                </Box>
            </Drawer>
        </Box>
    );
};

export default ProductList;