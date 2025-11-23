// ProductList.jsx - Final Fully Fixed Version
import React, { useEffect, useState } from "react";
import {
    Box, Stack, Grid, FormControl, InputLabel, Select, MenuItem,
    Typography, IconButton, useTheme, useMediaQuery, Drawer, Divider,
    Accordion, AccordionSummary, AccordionDetails, FormGroup, FormControlLabel,
    Checkbox, Button, Chip, TextField, InputAdornment
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import {
    fetchProductsAsync,
    selectProducts,
    selectProductTotalResults,
    selectProductFetchStatus,
    resetProductFetchStatus
} from "../ProductSlice";

import { selectBrands } from "../../brands/BrandSlice";
import { selectCategories } from "../../categories/CategoriesSlice";
import { selectLoggedInUser } from "../../auth/AuthSlice";

import {
    createWishlistItemAsync, deleteWishlistItemByIdAsync,
    selectWishlistItems, selectWishlistItemAddStatus, selectWishlistItemDeleteStatus,
    resetWishlistItemAddStatus, resetWishlistItemDeleteStatus
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
    { name: "Price: high to low", sort: "price", order: "desc", value: "price-desc" }
];

/* Skeleton */
const ProductCardSkeleton = () => (
    <Stack spacing={1} sx={{ width: "100%", maxWidth: 340, p: 1 }}>
        <Box sx={{ width: "100%", aspectRatio: "1/1", bgcolor: "grey.100", borderRadius: 2 }} />
        <Box sx={{ height: 16, bgcolor: "grey.100", width: "60%" }} />
        <Box sx={{ height: 14, bgcolor: "grey.100", width: "40%" }} />
    </Stack>
);

export const ProductList = () => {

    /* ────────────────────────────────────────────────────────────── */
    /* Redux + Hooks Setup                                            */
    /* ────────────────────────────────────────────────────────────── */

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

    /* URL Param Extract */
    const urlSearch = searchParams.get("search") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlPage = parseInt(searchParams.get("page") || "1");
    const urlBrands = searchParams.get("brands")?.split(",").filter(Boolean) || [];
    const urlCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];

    const [selectedBrands, setSelectedBrands] = useState(urlBrands);
    const [selectedCategories, setSelectedCategories] = useState(urlCategories);

    /* ────────────────────────────────────────────────────────────── */
    /* Debounced Mobile Search */
    /* ────────────────────────────────────────────────────────────── */

    useEffect(() => {
        if (!isMobile) return;

        const timer = setTimeout(() => {
            setDebouncedMobileSearch(mobileSearchQuery);

            const params = new URLSearchParams(searchParams);
            if (mobileSearchQuery.trim()) params.set("search", mobileSearchQuery.trim());
            else params.delete("search");

            params.delete("page");
            setSearchParams(params);
        }, 400);

        return () => clearTimeout(timer);
    }, [mobileSearchQuery, isMobile]);


    /* ────────────────────────────────────────────────────────────── */
    /* Re-sync Checkbox Filters With URL */
    /* ────────────────────────────────────────────────────────────── */

    useEffect(() => {
        setSelectedBrands(urlBrands);
        setSelectedCategories(urlCategories);
    }, [urlBrands.join(","), urlCategories.join(",")]);


    /* ────────────────────────────────────────────────────────────── */
    /* FETCH PRODUCTS */
    /* ────────────────────────────────────────────────────────────── */

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
            sort
        };

        if (searchTerm.trim()) payload.search = searchTerm.trim();
        if (!loggedInUser?.isAdmin) payload.user = true;

        dispatch(fetchProductsAsync(payload));
    }, [
        urlSearch,
        urlSort,
        urlPage,
        urlBrands.join(","),
        urlCategories.join(","),
        debouncedMobileSearch
    ]);


    /* ────────────────────────────────────────────────────────────── */
    /* Pagination Calculation — FIXED */
    /* ────────────────────────────────────────────────────────────── */

    const totalPages = Math.max(1, Math.ceil((totalResults || 0) / ITEMS_PER_PAGE));


    /* Prevent invalid page (fixes ?page=10 ghost) */
    useEffect(() => {
        if (fetchStatus === "fulfilled" && urlPage > totalPages) {
            const params = new URLSearchParams(searchParams);
            params.set("page", totalPages.toString());
            setSearchParams(params, { replace: true });
        }
    }, [fetchStatus, totalPages, urlPage]);


    /* ────────────────────────────────────────────────────────────── */
    /* Page Change Handler - SAFE */
    /* ────────────────────────────────────────────────────────────── */

    const handlePageChange = (e, page) => {
        const valid = Math.max(1, Math.min(page, totalPages));

        const params = new URLSearchParams(searchParams);
        params.set("page", valid.toString());
        setSearchParams(params);

        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    /* ────────────────────────────────────────────────────────────── */
    /* Page Number Generator — FIXED, NO GHOSTS */
    /* ────────────────────────────────────────────────────────────── */

    const generatePageNumbers = () => {
        const pages = [];
        const delta = isMobile ? 1 : 2;
        const left = urlPage - delta;
        const right = urlPage + delta;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                pages.push(i);
            }
        }

        const finalPages = [];
        let prev = 0;

        for (const page of pages) {
            if (page - prev === 2) finalPages.push(prev + 1);
            else if (page - prev > 2) finalPages.push("ellipsis-" + page);

            finalPages.push(page);
            prev = page;
        }

        return finalPages;
    };


    /* ────────────────────────────────────────────────────────────── */
    /* Wishlist / Filters / Sorting — NO CHANGE */
    /* ────────────────────────────────────────────────────────────── */

    const visibleProducts = products.filter((p) => !p.isDeleted);
    const showNoResults = fetchStatus === "fulfilled" && visibleProducts.length === 0;
    const activeFilterCount = selectedBrands.length + selectedCategories.length;

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

    const handleBrand = (e) => {
        const id = e.target.value;
        const updated = e.target.checked
            ? [...selectedBrands, id]
            : selectedBrands.filter((b) => b !== id);

        setSelectedBrands(updated);
        updateFiltersInURL(updated, selectedCategories);
    };

    const handleCategory = (e) => {
        const id = e.target.value;
        const updated = e.target.checked
            ? [...selectedCategories, id]
            : selectedCategories.filter((c) => c !== id);

        setSelectedCategories(updated);
        updateFiltersInURL(selectedBrands, updated);
    };

    const updateFiltersInURL = (brands, categories) => {
        const params = new URLSearchParams(searchParams);

        if (brands.length) params.set("brands", brands.join(","));
        else params.delete("brands");

        if (categories.length) params.set("categories", categories.join(","));
        else params.delete("categories");

        params.delete("page");
        setSearchParams(params);
    };


    /* Wishlist toggle */
    const handleWishlistToggle = (e, productId) => {
        if (e.target.checked) {
            dispatch(
                createWishlistItemAsync({
                    user: loggedInUser?._id,
                    product: productId
                })
            );
        } else {
            const item = wishlistItems.find((i) => i.product._id === productId);
            if (item) dispatch(deleteWishlistItemByIdAsync(item._id));
        }
    };


    /* ────────────────────────────────────────────────────────────── */
    /* RENDER SECTION */
    /* ────────────────────────────────────────────────────────────── */

    return (
        <Box>

            {/* MOBILE SEARCH UI */}
            {isMobile && (
                <Box sx={{ mt: 3, px: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search products..."
                            value={mobileSearchQuery}
                            onChange={(e) => setMobileSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: mobileSearchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleClearMobileSearch}>
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {/* Sort + Filter Mobile */}
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Sort</InputLabel>
                                <Select value={urlSort} label="Sort" onChange={handleSortChange}>
                                    <MenuItem value="">
                                        <em>Default</em>
                                    </MenuItem>
                                    {sortOptions.map((s) => (
                                        <MenuItem value={s.value} key={s.value}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ position: "relative" }}>
                                <Button
                                    variant={activeFilterCount ? "contained" : "outlined"}
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

            {/* MAIN PRODUCT LIST */}
            <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, mt: 3, maxWidth: 1400, mx: "auto" }}>

                {/* LOADING STATE */}
                {fetchStatus === "pending" && (
                    <Grid container spacing={2}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Grid item xs={6} sm={4} md={3} key={i}>
                                <ProductCardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* NO RESULTS */}
                {fetchStatus === "fulfilled" && showNoResults && (
                    <Stack justifyContent="center" alignItems="center" sx={{ mt: 8 }}>
                        <Box sx={{ width: 220 }}>
                            <Lottie animationData={NotFoundSearch} loop />
                        </Box>
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            No products found
                        </Typography>
                    </Stack>
                )}

                {/* PRODUCT GRID */}
                {fetchStatus === "fulfilled" && !showNoResults && (
                    <>
                        <Grid container spacing={2}>
                            {visibleProducts.map((p) => (
                                <Grid key={p._id} item xs={6} sm={4} md={3}>
                                    <ProductCard
                                        id={p._id}
                                        title={p.title}
                                        price={p.price}
                                        thumbnail={p.thumbnail}
                                        brand={p.brand?.name}
                                        stockQuantity={p.stockQuantity}
                                        handleAddRemoveFromWishlist={handleWishlistToggle}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* SIMPLE + SMALL PAGINATION — ONLY ARROWS */}
                        {totalPages > 1 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    mt: 3,
                                    mb: 3
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        p: 0.5,
                                        bgcolor: "background.paper",
                                        borderRadius: 2,
                                        alignItems: "center"
                                    }}
                                >
                                    {/* PREVIOUS */}
                                    <IconButton
                                        size="small"
                                        disabled={urlPage === 1}
                                        onClick={(e) => handlePageChange(e, urlPage - 1)}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            border: "1px solid #ddd",
                                            borderRadius: 1
                                        }}
                                    >
                                        <ChevronLeftIcon sx={{ fontSize: 18 }} />
                                    </IconButton>

                                    {/* CURRENT PAGE DOTS */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.6
                                        }}
                                    >
                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            return (
                                                <Box
                                                    key={page}
                                                    sx={{
                                                        width: page === urlPage ? 8 : 6,
                                                        height: page === urlPage ? 8 : 6,
                                                        bgcolor: page === urlPage ? "primary.main" : "grey.400",
                                                        borderRadius: "50%"
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>

                                    {/* NEXT */}
                                    <IconButton
                                        size="small"
                                        disabled={urlPage === totalPages}
                                        onClick={(e) => handlePageChange(e, urlPage + 1)}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            border: "1px solid #ddd",
                                            borderRadius: 1
                                        }}
                                    >
                                        <ChevronRightIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Stack>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};
