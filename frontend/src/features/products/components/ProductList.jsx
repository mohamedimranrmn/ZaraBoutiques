// frontend/src/features/products/components/ProductList.jsx
import React, { useEffect, useState } from "react";
import {
    Box, Stack, Grid, FormControl, InputLabel, Select, MenuItem,
    Typography, IconButton, useTheme, useMediaQuery, Drawer, Divider,
    Accordion, AccordionSummary, AccordionDetails, FormGroup, FormControlLabel,
    Checkbox, Pagination, Button, Chip, TextField, InputAdornment
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";

import { useDispatch, useSelector } from "react-redux";
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
import { ProductBanner } from "./ProductBanner";

import Lottie from "lottie-react";
import { loadingAnimation, banner1, banner2, banner3, banner4 } from "../../../assets";
import NotFoundSearch from "../../../assets/animations/NotFoundSearch.json";
import { ITEMS_PER_PAGE } from "../../../constants";

const sortOptions = [
    { name: "Price: low to high", sort: "price", order: "asc" },
    { name: "Price: high to low", sort: "price", order: "desc" },
];

const bannerImages = [banner1, banner2, banner3, banner4];

/* Skeleton Card */
const ProductCardSkeleton = () => (
    <Stack spacing={1} sx={{ width: "100%", maxWidth: 340, p: 1 }}>
        <Box sx={{ width: "100%", aspectRatio: "1/1", bgcolor: "grey.100", borderRadius: 2 }} />
        <Box sx={{ height: 16, bgcolor: "grey.100", width: "60%" }} />
        <Box sx={{ height: 14, bgcolor: "grey.100", width: "40%" }} />
    </Stack>
);

export const ProductList = () => {
    const dispatch = useDispatch();
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState(null);
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    /* Debounce search input */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    /* Fetch products */
    useEffect(() => {
        const payload = {
            ...filters,
            pagination: { page, limit: ITEMS_PER_PAGE },
            sort
        };
        if (debouncedSearch.trim()) {
            payload.search = debouncedSearch.trim();
        }
        if (!loggedInUser?.isAdmin) payload.user = true;
        dispatch(fetchProductsAsync(payload));
    }, [filters, sort, page, debouncedSearch]);

    /* Toast logic */
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
    }, []);

    const handleBrand = (e) => {
        const setB = new Set(filters.brand || []);
        e.target.checked ? setB.add(e.target.value) : setB.delete(e.target.value);
        setFilters({ ...filters, brand: [...setB] });
        setPage(1);
    };

    const handleCategory = (e) => {
        const setC = new Set(filters.category || []);
        e.target.checked ? setC.add(e.target.value) : setC.delete(e.target.value);
        setFilters({ ...filters, category: [...setC] });
        setPage(1);
    };

    const handleWishlistToggle = (e, productId) => {
        if (e.target.checked) {
            dispatch(createWishlistItemAsync({ user: loggedInUser?._id, product: productId }));
        } else {
            const idx = wishlistItems.findIndex((i) => i.product._id === productId);
            if (idx !== -1) dispatch(deleteWishlistItemByIdAsync(wishlistItems[idx]._id));
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setDebouncedSearch("");
    };

    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    const activeFilterCount =
        (filters.brand?.length || 0) + (filters.category?.length || 0);

    const showNoResults = fetchStatus === "fulfilled" && products.length === 0;

    return (
        <Box>
            {/* ============================================================ */}
            {/* 1) PRODUCT BANNER */}
            {/* ============================================================ */}
            <Box sx={{
                width: "100%",
                height: { xs: 180, sm: 260, md: 360, lg: 400 },
                px: { xs: 1, md: 3 },
                mt: 1,
                mb: { xs: 3, sm: 4, md: 12 }
            }}>
                <ProductBanner images={bannerImages} />
            </Box>

            {/* ============================================================ */}
            {/* 2) SEARCH, SORT, FILTER CONTROLS */}
            {/* ============================================================ */}
            <Box
                sx={{
                    mt: 3,
                    px: { xs: 2, sm: 3, md: 4 },
                    maxWidth: "1400px",
                    mx: "auto"
                }}
            >
                {/* MOBILE LAYOUT */}
                {isMobile ? (
                    <Stack spacing={2}>
                        {/* First Line: Search Bar */}
                        <TextField
                            fullWidth
                            placeholder="Search products, brands, categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleClearSearch}>
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    bgcolor: "background.paper"
                                }
                            }}
                        />

                        {/* Second Line: Sort and Filter */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            {/* Sort Button (Left) */}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Sort</InputLabel>
                                <Select
                                    label="Sort"
                                    value={sort || ""}
                                    onChange={(e) => setSort(e.target.value || null)}
                                    startAdornment={<SortIcon sx={{ mr: 1 }} />}
                                >
                                    <MenuItem value="">
                                        <em>Default</em>
                                    </MenuItem>
                                    {sortOptions.map((s, i) => (
                                        <MenuItem key={i} value={s}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Filter Button (Right) */}
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
                ) : (
                    /* DESKTOP LAYOUT */
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        {/* Sort Button (Left) */}
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Sort</InputLabel>
                            <Select
                                label="Sort"
                                value={sort || ""}
                                onChange={(e) => setSort(e.target.value || null)}
                                startAdornment={<SortIcon sx={{ mr: 1 }} />}
                            >
                                <MenuItem value="">
                                    <em>Default</em>
                                </MenuItem>
                                {sortOptions.map((s, i) => (
                                    <MenuItem key={i} value={s}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Search Bar (Center - Grows) */}
                        <Box sx={{ flexGrow: 1 }}>
                            <TextField
                                fullWidth
                                placeholder="Search products, brands, categories, descriptions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={handleClearSearch}>
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 3,
                                        bgcolor: "background.paper"
                                    },
                                    minWidth: "380px"
                                }}
                            />
                        </Box>

                        {/* Filter Button (Right) */}
                        <Box sx={{ position: "relative" }}>
                            <Button
                                variant={activeFilterCount > 0 ? "contained" : "outlined"}
                                size="small"
                                startIcon={<FilterListIcon />}
                                onClick={() => setDrawerOpen(true)}
                                sx={{ whiteSpace: "nowrap" }}
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
                )}
            </Box>

            {/* ============================================================ */}
            {/* 3) PRODUCT LIST / NO RESULTS / LOADING */}
            {/* ============================================================ */}
            <Box
                sx={{
                    px: { xs: 1, sm: 2, md: 4, lg: 5 },
                    py: { xs: 2, sm: 3 },
                    mt: { xs: 2, md: 4 },
                    maxWidth: "1400px",
                    mx: "auto"
                }}
            >
                {fetchStatus === "pending" ? (
                    <Grid container spacing={{ xs: 1.2, sm: 1.5, md: 2.2 }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Grid key={i} item xs={6} sm={4} md={4} lg={3}>
                                <ProductCardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : showNoResults ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "45vh", py: 4 }}>
                        <Box sx={{ width: isMobile ? 220 : 320 }}>
                            <Lottie animationData={NotFoundSearch} loop />
                        </Box>

                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} sx={{ mt: 1 }}>
                            No products found
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {searchQuery
                                ? `No results found. Try with different keywords.`
                                : "Try adjusting your filters or search terms."}
                        </Typography>

                        {(searchQuery || activeFilterCount > 0) && (
                            <Button
                                variant="outlined"
                                sx={{ mt: 3 }}
                                onClick={() => {
                                    setSearchQuery("");
                                    setDebouncedSearch("");
                                    setFilters({});
                                    setSort(null);
                                }}
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </Stack>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {searchQuery && `Search results for "${searchQuery}" - `}
                            Showing {products.length} of {totalResults} products
                        </Typography>

                        <Grid container spacing={2}>
                            {products.map((p) => (
                                <Grid key={p._id} item xs={6} sm={6} md={4} lg={3} sx={{ display: "flex" }}>
                                    <ProductCard
                                        id={p._id}
                                        title={p.title}
                                        price={p.price}
                                        thumbnail={p.thumbnail}
                                        brand={p.brand?.name}
                                        stockQuantity={p.stockQuantity}
                                        handleAddRemoveFromWishlist={(e, id) => handleWishlistToggle(e, id)}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {totalPages > 1 && (
                            <Stack alignItems="center" mt={4}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(e, v) => setPage(v)}
                                    color="primary"
                                />
                            </Stack>
                        )}
                    </>
                )}
            </Box>

            {/* ============================================================ */}
            {/* 4) FILTER DRAWER (MOBILE & DESKTOP) */}
            {/* ============================================================ */}
            <Drawer
                anchor="bottom"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        maxHeight: "80vh",
                        overflow: "hidden"
                    }
                }}
            >
                <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Filters</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)}>
                            <ClearIcon />
                        </IconButton>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Brands */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<AddIcon />}>
                            <Typography>Brands</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormGroup>
                                {brands.map((b) => (
                                    <FormControlLabel
                                        key={b._id}
                                        control={
                                            <Checkbox
                                                value={b._id}
                                                checked={filters.brand?.includes(b._id) || false}
                                                onChange={handleBrand}
                                            />
                                        }
                                        label={b.name}
                                    />
                                ))}
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>

                    <Divider sx={{ my: 2 }} />

                    {/* Categories */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<AddIcon />}>
                            <Typography>Categories</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormGroup>
                                {categories.map((c) => (
                                    <FormControlLabel
                                        key={c._id}
                                        control={
                                            <Checkbox
                                                value={c._id}
                                                checked={filters.category?.includes(c._id) || false}
                                                onChange={handleCategory}
                                            />
                                        }
                                        label={c.name}
                                    />
                                ))}
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>

                    <Box mt={2}>
                        <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>
                            Apply
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};