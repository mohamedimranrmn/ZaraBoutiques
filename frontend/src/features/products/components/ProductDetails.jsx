import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
    clearSelectedProduct,
    fetchProductByIdAsync,
    resetProductFetchStatus,
    selectProductFetchStatus,
    selectSelectedProduct,
} from "../ProductSlice";

import {
    Box,
    Checkbox,
    Rating,
    Stack,
    Typography,
    useMediaQuery,
    Button,
    IconButton,
    Container,
    alpha,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";

import {
    addToCartAsync,
    resetCartItemAddStatus,
    selectCartItemAddStatus,
    selectCartItems,
} from "../../cart/CartSlice";

import { selectLoggedInUser } from "../../auth/AuthSlice";

import {
    fetchReviewsByProductIdAsync,
    resetReviewFetchStatus,
    selectReviewFetchStatus,
    selectReviews
} from "../../review/ReviewSlice";

import { Reviews } from "../../review/components/Reviews";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Favorite from "@mui/icons-material/Favorite";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
    createWishlistItemAsync,
    deleteWishlistItemByIdAsync,
    resetWishlistItemAddStatus,
    resetWishlistItemDeleteStatus,
    selectWishlistItemAddStatus,
    selectWishlistItemDeleteStatus,
    selectWishlistItems,
} from "../../wishlist/WishlistSlice";

import SwipeableViews from "react-swipeable-views-react-18-fix";
import { autoPlay } from "react-swipeable-views-utils-react-18-fix";
import MobileStepper from "@mui/material/MobileStepper";

import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import { toast } from "react-toastify";
import { useTheme } from "@mui/material";

import Lottie from "lottie-react";
import { loadingAnimation } from "../../../assets";

import { fetchProductStock } from "../ProductApi";

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

// prevent duplicate toasts for statuses
const useOnceToast = (status, successMsg, errorMsg, resetAction) => {
    const dispatch = useDispatch();
    const prev = useRef(null);
    useEffect(() => {
        if (prev.current !== status) {
            if (status === "fulfilled") {
                toast.success(successMsg);
                dispatch(resetAction());
            } else if (status === "rejected") {
                toast.error(errorMsg);
                dispatch(resetAction());
            }
        }
        prev.current = status;
    }, [status, dispatch, resetAction, successMsg, errorMsg]);
};

export const ProductDetails = () => {
    const { id } = useParams();
    const product = useSelector(selectSelectedProduct);
    const loggedInUser = useSelector(selectLoggedInUser);
    const dispatch = useDispatch();
    const cartItems = useSelector(selectCartItems);
    const cartItemAddStatus = useSelector(selectCartItemAddStatus);
    const reviews = useSelector(selectReviews);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null); // SIZE STATE
    const [activeStep, setActiveStep] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const navigate = useNavigate();

    const wishlistItems = useSelector(selectWishlistItems);
    const wishlistItemAddStatus = useSelector(selectWishlistItemAddStatus);
    const wishlistItemDeleteStatus = useSelector(selectWishlistItemDeleteStatus);

    const productFetchStatus = useSelector(selectProductFetchStatus);
    const reviewFetchStatus = useSelector(selectReviewFetchStatus);

    const totalReviews = reviews.length;
    const avgRating = totalReviews
        ? Math.ceil(reviews.reduce((a, b) => a + b.rating, 0) / totalReviews)
        : 0;

    const isInCart = cartItems.some((item) => item.product._id === id);
    const isInWishlist = wishlistItems.some((item) => item.product._id === id);

    // Live stock state
    const [liveStock, setLiveStock] = useState(0);

    // ✅ FIXED: Use sizes from database - show if sizes exist, regardless of requiresSize flag
    const showSizeSelector = product?.sizes && product.sizes.length > 0;
    const availableSizes = product?.sizes || [];
    const isSizeRequired = product?.requiresSize === true;

    // Toast handlers
    useOnceToast(
        cartItemAddStatus,
        "Product added to cart",
        "Failed to add to cart",
        resetCartItemAddStatus
    );
    useOnceToast(
        wishlistItemAddStatus,
        "Product added to wishlist",
        "Failed to add to wishlist",
        resetWishlistItemAddStatus
    );
    useOnceToast(
        wishlistItemDeleteStatus,
        "Product removed from wishlist",
        "Failed removing wishlist item",
        resetWishlistItemDeleteStatus
    );

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    useEffect(() => {
        if (id) {
            dispatch(fetchProductByIdAsync(id));
            dispatch(fetchReviewsByProductIdAsync(id));
        }
    }, [id, dispatch]);

    // Sync liveStock when product loads/changes
    useEffect(() => {
        if (product) {
            setLiveStock(product.stockQuantity ?? 0);
        }
    }, [product]);

    // Auto-refresh stock from backend
    useEffect(() => {
        if (!product?._id) return;

        let isMounted = true;

        const refreshStock = async () => {
            try {
                const data = await fetchProductStock(product._id);
                if (!isMounted) return;

                if (
                    typeof data.stockQuantity === "number" &&
                    data.stockQuantity !== liveStock
                ) {
                    setLiveStock(data.stockQuantity);

                    toast.info(
                        `Stock updated – ${data.stockQuantity} left`,
                        { toastId: `stock-update-${product._id}` }
                    );
                }
            } catch (err) {
                console.log("Stock refresh failed", err?.message || err);
            }
        };

        refreshStock();

        const interval = setInterval(refreshStock, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [product?._id, liveStock]);

    useEffect(() => {
        return () => {
            dispatch(clearSelectedProduct());
            dispatch(resetProductFetchStatus());
            dispatch(resetReviewFetchStatus());
        };
    }, [dispatch]);

    const handleAddToCart = () => {
        if (!loggedInUser) {
            toast.error("Please login to add items to cart");
            return;
        }

        if (liveStock <= 0) {
            toast.error("This product is out of stock");
            return;
        }

        if (quantity > liveStock) {
            toast.error(`Only ${liveStock} left in stock`);
            return;
        }

        // ✅ Check if size is required (only if requiresSize flag is true)
        if (showSizeSelector && isSizeRequired && !selectedSize) {
            toast.error("Please select a size");
            return;
        }

        dispatch(
            addToCartAsync({
                user: loggedInUser._id,
                product: id,
                quantity,
                size: selectedSize // PASS SIZE TO CART
            })
        );
        setQuantity(1);
        setSelectedSize(null); // Reset size after adding
    };

    const handleBuyNowNavigate = () => {
        if (liveStock <= 0) {
            toast.error("This product is out of stock");
            return;
        }

        if (quantity > liveStock) {
            toast.error(`Only ${liveStock} left in stock`);
            return;
        }

        // ✅ Check if size is required (only if requiresSize flag is true)
        if (showSizeSelector && isSizeRequired && !selectedSize) {
            toast.error("Please select a size");
            return;
        }

        const productForCheckout = {
            _id: product._id,
            product: {
                _id: product._id,
                title: product.title,
                price: product.price,
                thumbnail: product.images?.[0] || product.thumbnail,
                brand: { name: product.brand?.name },
                stockQuantity: liveStock
            },
            quantity,
            size: selectedSize // PASS SIZE
        };

        navigate("/checkout", { state: { selectedItems: [productForCheckout] } });
    };

    if (productFetchStatus === "pending") {
        return (
            <Stack height="60vh" justifyContent="center" alignItems="center">
                <Lottie animationData={loadingAnimation} style={{ width: 320 }} />
            </Stack>
        );
    }

    if (!product) return null;

    const maxSteps = product.images?.length || 0;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: alpha(theme.palette.grey[50], 0.3) }}>
            {/* Desktop: Top Bar with Back Button */}
            {!isMobile && (
                <Box
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'white',
                        py: 2.5
                    }}
                >
                    <Container maxWidth="lg">
                        <Stack direction="row" alignItems="center" gap={2}>
                            <IconButton
                                onClick={() => navigate(-1)}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.grey[100], 0.5),
                                        transform: 'translateX(-3px)'
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    Product Details
                                </Typography>
                            </Box>
                        </Stack>
                    </Container>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                {/* Mobile: Back Button with Header */}
                {isMobile && (
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
                        <IconButton
                            onClick={() => navigate(-1)}
                            sx={{
                                bgcolor: 'white',
                                boxShadow: 1,
                                '&:hover': {
                                    bgcolor: 'white',
                                    transform: 'translateX(-3px)',
                                    boxShadow: 2
                                },
                                transition: 'all 0.2s'
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" fontWeight={700}>
                            Product Details
                        </Typography>
                    </Stack>
                )}

                <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={4}
                    width="100%"
                >
                    {/* Images */}
                    <Stack width={isMobile ? "100%" : "50%"}>
                        <Box
                            sx={{
                                bgcolor: 'white',
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <AutoPlaySwipeableViews
                                index={activeStep}
                                onChangeIndex={(i) => setActiveStep(i)}
                                enableMouseEvents
                            >
                                {product.images?.map((img, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: "100%",
                                            height: isMobile ? 260 : 420,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            p: 2
                                        }}
                                    >
                                        <img
                                            src={img}
                                            alt={product.title}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                            }}
                                        />
                                    </Box>
                                ))}
                            </AutoPlaySwipeableViews>

                            {maxSteps > 0 && (
                                <MobileStepper
                                    steps={maxSteps}
                                    position="static"
                                    activeStep={activeStep}
                                    sx={{
                                        bgcolor: 'transparent',
                                        borderTop: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                    nextButton={
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                setActiveStep((s) => Math.min(s + 1, maxSteps - 1))
                                            }
                                            disabled={activeStep === maxSteps - 1}
                                        >
                                            <KeyboardArrowRightIcon />
                                        </IconButton>
                                    }
                                    backButton={
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                setActiveStep((s) => Math.max(s - 1, 0))
                                            }
                                            disabled={activeStep === 0}
                                        >
                                            <KeyboardArrowLeftIcon />
                                        </IconButton>
                                    }
                                />
                            )}
                        </Box>
                    </Stack>

                    {/* Details */}
                    <Stack width={isMobile ? "100%" : "50%"} spacing={2}>
                        <Box
                            sx={{
                                bgcolor: 'white',
                                p: { xs: 2, md: 3 },
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack spacing={2.5}>
                                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700}>
                                    {product.title}
                                </Typography>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Rating value={avgRating} readOnly size={isMobile ? "small" : "medium"} />
                                    <Typography variant="body2" color="text.secondary">
                                        ({totalReviews} Reviews)
                                    </Typography>
                                </Stack>

                                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} color="primary.main">
                                    ₹{product.price}
                                </Typography>

                                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                    {product.description}
                                </Typography>

                                {/* ✅ SIZE SELECTOR - UPDATED TO USE DATABASE SIZES */}
                                {showSizeSelector && (
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} mb={1.5}>
                                            Select Size {isSizeRequired && <Typography component="span" color="error.main">*</Typography>}
                                            {selectedSize && (
                                                <Typography component="span" color="primary.main" fontWeight={700}>
                                                    {' '}({selectedSize})
                                                </Typography>
                                            )}
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={selectedSize}
                                            exclusive
                                            onChange={(e, newSize) => setSelectedSize(newSize)}
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 1
                                            }}
                                        >
                                            {availableSizes.map((size) => (
                                                <ToggleButton
                                                    key={size}
                                                    value={size}
                                                    sx={{
                                                        minWidth: { xs: 45, md: 55 },
                                                        height: { xs: 40, md: 45 },
                                                        borderRadius: 1.5,
                                                        fontWeight: 600,
                                                        border: '1.5px solid',
                                                        borderColor: 'divider',
                                                        '&.Mui-selected': {
                                                            bgcolor: 'primary.main',
                                                            color: 'white',
                                                            borderColor: 'primary.main',
                                                            '&:hover': {
                                                                bgcolor: 'primary.dark'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            borderColor: 'primary.main',
                                                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                                                        }
                                                    }}
                                                >
                                                    {size}
                                                </ToggleButton>
                                            ))}
                                        </ToggleButtonGroup>
                                        {isSizeRequired && !selectedSize && (
                                            <Typography
                                                variant="caption"
                                                color="error.main"
                                                sx={{
                                                    mt: 1,
                                                    display: 'block',
                                                    fontWeight: 500
                                                }}
                                            >
                                                * Size selection required
                                            </Typography>
                                        )}
                                        {!isSizeRequired && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    mt: 1,
                                                    display: 'block',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1.5,
                                        bgcolor: liveStock <= 0
                                            ? alpha(theme.palette.error.main, 0.08)
                                            : liveStock <= 10
                                                ? alpha(theme.palette.warning.main, 0.08)
                                                : alpha(theme.palette.success.main, 0.08),
                                        border: '1px solid',
                                        borderColor: liveStock <= 0
                                            ? alpha(theme.palette.error.main, 0.2)
                                            : liveStock <= 10
                                                ? alpha(theme.palette.warning.main, 0.2)
                                                : alpha(theme.palette.success.main, 0.2)
                                    }}
                                >
                                    <Typography
                                        fontWeight={600}
                                        color={
                                            liveStock <= 0
                                                ? "error.main"
                                                : liveStock <= 10
                                                    ? "warning.main"
                                                    : "success.main"
                                        }
                                    >
                                        {liveStock <= 0
                                            ? "⚠️ Out of stock"
                                            : liveStock <= 10
                                                ? `⚡ Only ${liveStock} left in stock`
                                                : "✓ In Stock"}
                                    </Typography>
                                </Box>

                                {/* Quantity + Actions */}
                                <Stack spacing={2} mt={2}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" fontWeight={600}>
                                            Quantity:
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ minWidth: 36, height: 36 }}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        >
                                            -
                                        </Button>
                                        <Typography fontWeight={600} sx={{ minWidth: 30, textAlign: 'center' }}>
                                            {quantity}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ minWidth: 36, height: 36 }}
                                            onClick={() => {
                                                if (quantity < liveStock) {
                                                    setQuantity(quantity + 1);
                                                } else {
                                                    toast.error(
                                                        liveStock > 0
                                                            ? `Only ${liveStock} left in stock`
                                                            : "Out of stock"
                                                    );
                                                }
                                            }}
                                            disabled={liveStock <= 0}
                                        >
                                            +
                                        </Button>
                                    </Stack>

                                    {isInCart ? (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            sx={{
                                                py: 1.5,
                                                fontSize: "1rem",
                                                fontWeight: 600,
                                                borderRadius: 1.5
                                            }}
                                            onClick={handleBuyNowNavigate}
                                            disabled={liveStock <= 0 || (showSizeSelector && isSizeRequired && !selectedSize)}
                                        >
                                            Buy Now
                                        </Button>
                                    ) : (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            sx={{
                                                py: 1.5,
                                                fontSize: "1rem",
                                                fontWeight: 600,
                                                bgcolor: "black",
                                                borderRadius: 1.5,
                                                "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                                            }}
                                            onClick={handleAddToCart}
                                            disabled={liveStock <= 0 || (showSizeSelector && isSizeRequired && !selectedSize)}
                                        >
                                            Add to Cart
                                        </Button>
                                    )}

                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{
                                            p: 1,
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: alpha(theme.palette.grey[50], 0.5)
                                        }}
                                    >
                                        <Checkbox
                                            checked={isInWishlist}
                                            onChange={(e) => {
                                                if (!loggedInUser) {
                                                    toast.error("Please login to manage wishlist");
                                                    return;
                                                }

                                                if (e.target.checked) {
                                                    dispatch(
                                                        createWishlistItemAsync({
                                                            user: loggedInUser._id,
                                                            product: id,
                                                        })
                                                    );
                                                } else {
                                                    const existing = wishlistItems.find(
                                                        (i) => i.product._id === id
                                                    );
                                                    if (existing) {
                                                        dispatch(
                                                            deleteWishlistItemByIdAsync(existing._id)
                                                        );
                                                    }
                                                }
                                            }}
                                            icon={<FavoriteBorder />}
                                            checkedIcon={<Favorite sx={{ color: "red" }} />}
                                        />
                                        <Typography fontWeight={500}>Add to Wishlist</Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>

                {/* Reviews */}
                <Box sx={{ mt: 5 }}>
                    <Reviews productId={id} averageRating={avgRating} />
                </Box>
            </Container>
        </Box>
    );
};