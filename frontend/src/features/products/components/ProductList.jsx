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
import SearchIcon from "@mui/icons-material/Search";

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
import { ProductBanner } from "./ProductBanner";

import Lottie from "lottie-react";
import { loadingAnimation, banner1, banner2, banner3, banner4 } from "../../../assets";
import NotFoundSearch from "../../../assets/animations/NotFoundSearch.json";

import { ITEMS_PER_PAGE } from "../../../constants";
import SortIcon from "@mui/icons-material/Sort";

const sortOptions = [
    { name: "Price: low to high", sort: "price", order: "asc", value: "price-asc" },
    { name: "Price: high to low", sort: "price", order: "desc", value: "price-desc" },
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

    // Mobile-only search state
    const [mobileSearchQuery, setMobileSearchQuery] = useState("");
    const [debouncedMobileSearch, setDebouncedMobileSearch] = useState("");

    // Read from URL params
    const urlSearch = searchParams.get('search') || '';
    const urlSort = searchParams.get('sort') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlBrands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const urlCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

    // Local state for filters
    const [selectedBrands, setSelectedBrands] = useState(urlBrands);
    const [selectedCategories, setSelectedCategories] = useState(urlCategories);

    /* Debounce mobile search input */
    useEffect(() => {
        if (!isMobile) return;

        const timer = setTimeout(() => {
            setDebouncedMobileSearch(mobileSearchQuery);
            const params = new URLSearchParams(searchParams);
            if (mobileSearchQuery.trim()) {
                params.set('search', mobileSearchQuery.trim());
            } else {
                params.delete('search');
            }
            params.delete('page');
            setSearchParams(params);
        }, 400);

        return () => clearTimeout(timer);
    }, [mobileSearchQuery, isMobile]);

    // Sync filters with URL
    useEffect(() => {
        setSelectedBrands(urlBrands);
        setSelectedCategories(urlCategories);
    }, [searchParams.get('brands'), searchParams.get('categories')]);

    /* Fetch products based on URL params */
    useEffect(() => {
        const filters = {};
        if (urlBrands.length > 0) filters.brand = urlBrands;
        if (urlCategories.length > 0) filters.category = urlCategories;

        let sort = null;
        if (urlSort === 'price-asc') {
            sort = { sort: 'price', order: 'asc' };
        } else if (urlSort === 'price-desc') {
            sort = { sort: 'price', order: 'desc' };
        }

        const payload = {
            ...filters,
            pagination: { page: urlPage, limit: ITEMS_PER_PAGE },
            sort
        };

        const searchTerm = isMobile ? debouncedMobileSearch : urlSearch;
        if (searchTerm.trim()) payload.search = searchTerm.trim();

        if (!loggedInUser?.isAdmin) payload.user = true;

        dispatch(fetchProductsAsync(payload));
    }, [urlSearch, urlSort, urlPage, urlBrands.join(','), urlCategories.join(','), debouncedMobileSearch, isMobile]);

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

    // CRITICAL FIX: FILTER OUT soft-deleted products
    const visibleProducts = products.filter((p) => !p.isDeleted);

    const handleBrand = (e) => {
        const brandId = e.target.value;
        const newBrands = e.target.checked
            ? [...selectedBrands, brandId]
            : selectedBrands.filter(b => b !== brandId);

        setSelectedBrands(newBrands);
        updateFiltersInURL(newBrands, selectedCategories);
    };

    const handleCategory = (e) => {
        const catId = e.target.value;
        const newCategories = e.target.checked
            ? [...selectedCategories, catId]
            : selectedCategories.filter(c => c !== catId);

        setSelectedCategories(newCategories);
        updateFiltersInURL(selectedBrands, newCategories);
    };

    const updateFiltersInURL = (brands, categories) => {
        const params = new URLSearchParams(searchParams);

        if (brands.length > 0) {
            params.set('brands', brands.join(','));
        } else {
            params.delete('brands');
        }

        if (categories.length > 0) {
            params.set('categories', categories.join(','));
        } else {
            params.delete('categories');
        }

        params.delete('page');
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

    const handleClearMobileSearch = () => {
        setMobileSearchQuery("");
        setDebouncedMobileSearch("");
        const params = new URLSearchParams(searchParams);
        params.delete('search');
        params.delete('page');
        setSearchParams(params);
    };

    const handleSortChange = (e) => {
        const params = new URLSearchParams(searchParams);
        const sortValue = e.target.value;

        if (sortValue) {
            params.set('sort', sortValue);
        } else {
            params.delete('sort');
        }
        params.delete('page');
        setSearchParams(params);
    };

    const handlePageChange = (e, value) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', value.toString());
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClearAllFilters = () => {
        setMobileSearchQuery("");
        setDebouncedMobileSearch("");
        setSelectedBrands([]);
        setSelectedCategories([]);
        setSearchParams({});
    };

    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    const activeFilterCount = selectedBrands.length + selectedCategories.length;
    const showNoResults = fetchStatus === "fulfilled" && visibleProducts.length === 0;

    return (
        <Box>
            {/* BANNER */}
            <Box sx={{
                width: "100%",
                height: { xs: 180, sm: 260, md: 360, lg: 400 },
                px: { xs: 1, md: 3 },
                mt: 1,
                mb: { xs: 3, sm: 4, md: 12 }
            }}>
                <ProductBanner images={bannerImages} />
            </Box>
            {/* MOBILE SEARCH + SORT + FILTER */}
            {isMobile && (
                <Box sx={{ mt: 3, px: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search products, brands, categories..."
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
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    bgcolor: "background.paper"
                                }
                            }}
                        />

                        <Stack direction="row" justifyContent="space-between">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Sort</InputLabel>
                                <Select
                                    label="Sort"
                                    value={urlSort}
                                    onChange={handleSortChange}
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

            {/* PRODUCT LIST */}
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
                    <Grid container spacing={2}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Grid key={i} item xs={6} sm={4} md={3}>
                                <ProductCardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : showNoResults ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: "40vh" }}>
                        <Box sx={{ width: 260 }}>
                            <Lottie animationData={NotFoundSearch} loop />
                        </Box>

                        <Typography variant="h6" fontWeight={700}>
                            No products found
                        </Typography>

                        {(urlSearch || activeFilterCount > 0) && (
                            <Button
                                variant="outlined"
                                sx={{ mt: 3 }}
                                onClick={handleClearAllFilters}
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </Stack>
                ) : (
                    <>
                        {/* TOP BAR: Showing count + Sort + Filter (DESKTOP ONLY) */}
                        {!isMobile && !loggedInUser?.isAdmin && (
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{
                                    mb: 2,
                                    px: 1,
                                }}
                            >
                                {/* LEFT: Showing count */}
                                <Typography variant="body2" color="text.secondary">
                                    {urlSearch && `Search results for "${urlSearch}" - `}
                                    Showing {visibleProducts.length} of {totalResults} products
                                </Typography>

                                {/* RIGHT: Sort + Filter */}
                                <Stack direction="row" spacing={2} alignItems="center">

                                    {/* SORT */}
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <InputLabel>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <SortIcon fontSize="small" />
                                                <span>Sort</span>
                                            </Stack>
                                        </InputLabel>
                                        <Select
                                            label="Sort"
                                            value={urlSort}
                                            onChange={handleSortChange}
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

                                    {/* FILTER */}
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
                        )}

                        <Grid container spacing={2}>
                            {visibleProducts.map((p) => (
                                <Grid key={p._id} item xs={6} sm={6} md={4} lg={3}>
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
                                    page={urlPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Stack>
                        )}
                    </>
                )}
            </Box>

            {/* FILTER DRAWER */}
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
                    <Stack direction="row" justifyContent="space-between">
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
                                                checked={selectedBrands.includes(b._id)}
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
                                                checked={selectedCategories.includes(c._id)}
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