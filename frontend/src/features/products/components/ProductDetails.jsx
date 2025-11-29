import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";

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
    Skeleton,
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
    selectReviews,
} from "../../review/ReviewSlice";

import { Reviews } from "../../review/components/Reviews";

import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Favorite from "@mui/icons-material/Favorite";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";

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

import { fetchProductStock } from "../ProductApi";

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);


// Avoid duplicate toasts for the same status
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
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const product = useSelector(selectSelectedProduct);
    const handleShareProduct = async () => {
        if (!product) return;

        const productUrl = `https://zaraboutiques.onrender.com/product-details/${product._id}`;
        const firstImage = product.images?.[0];

        const shareContent =
            `${product.title}\n` +
            `Price: ₹${product.price}\n\n` +
            `${product.description?.slice(0, 150) || ""}\n\n` +
            `Image: ${firstImage}\n` +
            `Link: ${productUrl}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: shareContent,
                    url: productUrl
                });
            } catch (_) {}
        } else {
            try {
                await navigator.clipboard.writeText(shareContent);
            } catch (_) {}
        }
    };


    const loggedInUser = useSelector(selectLoggedInUser);
    const cartItems = useSelector(selectCartItems);
    const cartItemAddStatus = useSelector(selectCartItemAddStatus);

    // ✅ FIXED: Ensure wishlistItems is always an array
    const wishlistItems = useSelector(selectWishlistItems) || [];

    const wishlistItemAddStatus = useSelector(selectWishlistItemAddStatus);
    const wishlistItemDeleteStatus = useSelector(selectWishlistItemDeleteStatus);
    const reviews = useSelector(selectReviews);
    const productFetchStatus = useSelector(selectProductFetchStatus);

    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [liveStock, setLiveStock] = useState(0);
    const [isUnavailable, setIsUnavailable] = useState(false);

    const unavailableToastShownRef = useRef(false);

    const isInCart = cartItems.some(
        (item) => item.product && item.product._id === id
    );

    // ✅ FIXED: Safe check with Array.isArray
    const isInWishlist = Array.isArray(wishlistItems)
        ? wishlistItems.some((item) => item.product && item.product._id === id)
        : false;

    // Reviews / rating
    const totalReviews = reviews.length;
    const avgRating = totalReviews
        ? Math.ceil(reviews.reduce((a, b) => a + b.rating, 0) / totalReviews)
        : 0;

    // Size handling
    const showSizeSelector = product?.sizes && product.sizes.length > 0;
    const availableSizes = product?.sizes || [];
    const isSizeRequired =
        (product?.sizes?.length > 0) || product?.requiresSize === true;


    // Toasts for cart / wishlist operations
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

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    // Fetch product + reviews
    useEffect(() => {
        if (id) {
            dispatch(fetchProductByIdAsync(id));
            dispatch(fetchReviewsByProductIdAsync(id));
        }
    }, [id, dispatch]);

    // Sync live stock when product changes
    useEffect(() => {
        if (product) {
            setLiveStock(product.stockQuantity ?? 0);
        }
    }, [product]);

    // ✅ FIXED: Auto-refresh stock - stop for deleted/unavailable products
    useEffect(() => {
        // Stop polling if no product, or if product is deleted/unavailable
        if (!product?._id || product?.isDeleted || isUnavailable) return;

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

                    toast.info(`Stock updated – ${data.stockQuantity} left`, {
                        toastId: `stock-update-${product._id}`,
                    });
                }
            } catch (err) {
                // Silent fail, don't spam user for stock polling issues
                console.log("Stock refresh failed", err?.message || err);
            }
        };

        refreshStock();
        const interval = setInterval(refreshStock, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [product?._id, product?.isDeleted, isUnavailable, liveStock]);

    // Track unavailable/deleted state and toast once
    useEffect(() => {
        // Backend might:
        // 1. Return 404/410 -> slice sets status = 'rejected' and product = null
        // 2. Return product with isDeleted true (FIXED: now returns this)

        const deletedFromStatus =
            productFetchStatus === "rejected" && !product && !isUnavailable;

        const deletedFromFlag = !!product?.isDeleted;

        const nowUnavailable = deletedFromStatus || deletedFromFlag;

        if (nowUnavailable) {
            setIsUnavailable(true);

            if (!unavailableToastShownRef.current) {
                toast.error("This product is no longer available");
                unavailableToastShownRef.current = true;
            }
        } else if (product && !product.isDeleted && productFetchStatus === "fulfilled") {
            // Successfully loaded non-deleted product
            setIsUnavailable(false);
        }
    }, [productFetchStatus, product, isUnavailable]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(clearSelectedProduct());
            dispatch(resetProductFetchStatus());
            dispatch(resetReviewFetchStatus());
        };
    }, [dispatch]);

    const handleAddToCart = () => {
        if (!loggedInUser) {
            return navigate("/login");
        }

        if (isUnavailable) {
            toast.error("This product is no longer available");
            return;
        }

        if (liveStock <= 0) {
            toast.error("This product is out of stock");
            return;
        }

        if (!product) {
            toast.error("This product is no longer available");
            return;
        }

        if (quantity > liveStock) {
            toast.error(`Only ${liveStock} left in stock`);
            return;
        }

        if (showSizeSelector && isSizeRequired && !selectedSize) {
            toast.error("Please select a size");
            return;
        }

        dispatch(
            addToCartAsync({
                user: loggedInUser._id,
                product: id,
                quantity,
                size: selectedSize,
            })
        );
        setQuantity(1);
        setSelectedSize(null);
    };

    const handleBuyNowNavigate = () => {

        if (!loggedInUser) {
            return navigate("/login");
        }

        if (isUnavailable) {
            toast.error("This product is no longer available");
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
                stockQuantity: liveStock,
            },
            quantity,
            size: selectedSize,
        };

        navigate("/checkout", { state: { selectedItems: [productForCheckout] } });
    };

    const disabledActions =
        isUnavailable || liveStock <= 0 || (showSizeSelector && isSizeRequired && !selectedSize);

    const maxSteps = product?.images?.length || 0;

    // ------------------------------------------------------------------
    // SKELETON: while loading product
    // ------------------------------------------------------------------
    if (productFetchStatus === "pending") {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: alpha(theme.palette.grey[50], 0.3),
                }}
            >
                <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        spacing={4}
                        width="100%"
                    >
                        {/* Image skeleton */}
                        <Stack width={isMobile ? "100%" : "50%"}>
                            <Skeleton
                                variant="rectangular"
                                sx={{ width: "100%", height: isMobile ? 260 : 420, borderRadius: 2 }}
                            />
                        </Stack>

                        {/* Details skeleton */}
                        <Stack width={isMobile ? "100%" : "50%"} spacing={2}>
                            <Skeleton variant="text" width="80%" height={40} />
                            <Skeleton variant="text" width="40%" height={30} />
                            <Skeleton variant="text" width="30%" height={30} />
                            <Skeleton variant="rectangular" width="100%" height={80} />
                            <Skeleton variant="rectangular" width="60%" height={48} />
                            <Skeleton variant="rectangular" width="50%" height={48} />
                        </Stack>
                    </Stack>

                    <Box sx={{ mt: 5 }}>
                        <Skeleton variant="text" width="30%" height={32} />
                        <Skeleton variant="rectangular" width="100%" height={160} />
                    </Box>
                </Container>
            </Box>
        );
    }

    // ------------------------------------------------------------------
    // UNAVAILABLE / DELETED: show disabled layout + message
    // (productFetchStatus === 'rejected' OR product?.isDeleted === true)
    // ------------------------------------------------------------------
    if (!product && isUnavailable) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: alpha(theme.palette.grey[50], 0.3),
                }}
            >
                <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
                    <Stack spacing={3} alignItems="center">
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="error.main"
                            textAlign="center"
                        >
                            This product is no longer available.
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                            maxWidth={480}
                        >
                            It may have been removed or is temporarily unavailable. You can
                            continue shopping to explore other products.
                        </Typography>

                        <Button
                            variant="contained"
                            component={Link}
                            to="/"
                            sx={{ textTransform: "none", px: 3, py: 1.1 }}
                        >
                            Continue Shopping
                        </Button>

                        {/* Skeleton card to keep visual structure */}
                        <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={4}
                            width="100%"
                            sx={{ mt: 4 }}
                        >
                            <Stack width={isMobile ? "100%" : "50%"}>
                                <Skeleton
                                    variant="rectangular"
                                    sx={{
                                        width: "100%",
                                        height: isMobile ? 260 : 420,
                                        borderRadius: 2,
                                    }}
                                />
                            </Stack>
                            <Stack width={isMobile ? "100%" : "50%"} spacing={2}>
                                <Skeleton variant="text" width="80%" height={40} />
                                <Skeleton variant="text" width="40%" height={30} />
                                <Skeleton variant="rectangular" width="100%" height={80} />
                                <Skeleton variant="rectangular" width="60%" height={48} />
                                <Skeleton variant="rectangular" width="50%" height={48} />
                            </Stack>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        );
    }

    // ------------------------------------------------------------------
    // NORMAL RENDER (product loaded; may still be marked unavailable)
    // ------------------------------------------------------------------
    if (!product) {
        // Fallback safety: unknown error but not explicitly marked unavailable
        return (
            <Stack
                minHeight="60vh"
                alignItems="center"
                justifyContent="center"
                spacing={2}
            >
                <Typography variant="h6">
                    Unable to load this product at the moment.
                </Typography>
                <Button
                    variant="contained"
                    component={Link}
                    to="/"
                    sx={{ textTransform: "none" }}
                >
                    Continue Shopping
                </Button>
            </Stack>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: alpha(theme.palette.grey[50], 0.3),
            }}
        >
            <Helmet>
                <title>{product.title}</title>

                <meta property="og:title" content={product.title} />
                <meta property="og:description" content={product.description?.slice(0, 150) || ""} />
                <meta property="og:image" content={product.images?.[0]} />

                <meta property="og:url" content={`https://zaraboutiques.onrender.com/product-details/${product._id}`} />
                <meta property="og:type" content="product" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={product.title} />
                <meta name="twitter:description" content={product.description?.slice(0, 150) || ""} />
                <meta name="twitter:image" content={product.images?.[0]} />
            </Helmet>

            {/* Desktop top bar */}
            {!isMobile && (
                <Box
                    sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        bgcolor: "white",
                        py: 2.5,
                    }}
                >
                    <Container maxWidth="lg">
                        <Stack direction="row" alignItems="center" gap={2}>
                            <IconButton
                                onClick={() => navigate(-1)}
                                sx={{
                                    border: "1px solid",
                                    borderColor: "divider",
                                    "&:hover": {
                                        bgcolor: alpha(theme.palette.grey[100], 0.5),
                                        transform: "translateX(-3px)",
                                    },
                                    transition: "all 0.2s",
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
                {/* Mobile back button */}
                {isMobile && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={1.5}
                        sx={{ mb: 2 }}
                    >
                        <IconButton
                            onClick={() => navigate(-1)}
                            sx={{
                                bgcolor: "white",
                                boxShadow: 1,
                                "&:hover": {
                                    bgcolor: "white",
                                    transform: "translateX(-3px)",
                                    boxShadow: 2,
                                },
                                transition: "all 0.2s",
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" fontWeight={700}>
                            Product Details
                        </Typography>
                    </Stack>
                )}

                {/* Unavailable banner */}
                {isUnavailable && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.error.main, 0.06),
                            border: "1px solid",
                            borderColor: alpha(theme.palette.error.main, 0.3),
                        }}
                    >
                        <Typography
                            variant="body1"
                            fontWeight={600}
                            color="error.main"
                        >
                            This product is no longer available.
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            You can still view its details, but you will not be able to add it
                            to cart or wishlist.
                        </Typography>
                    </Box>
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
                                bgcolor: "white",
                                borderRadius: 2,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
                                position: "relative",
                            }}
                        >
                            <AutoPlaySwipeableViews
                                index={activeStep}
                                onChangeIndex={(i) => setActiveStep(i)}
                                enableMouseEvents
                            >
                                {(product.images || []).map((img, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: "100%",
                                            height: isMobile ? 260 : 420,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            p: 2,
                                            filter: isUnavailable ? "grayscale(0.9)" : "none",
                                            opacity: isUnavailable ? 0.7 : 1,
                                            transition: "filter 0.2s, opacity 0.2s",
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
                                        bgcolor: "transparent",
                                        borderTop: "1px solid",
                                        borderColor: "divider",
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
                                bgcolor: "white",
                                p: { xs: 2, md: 3 },
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Stack spacing={2.5}>
                                <Typography
                                    variant={isMobile ? "h5" : "h4"}
                                    fontWeight={700}
                                >
                                    {product.title}
                                </Typography>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Rating
                                        value={avgRating}
                                        readOnly
                                        size={isMobile ? "small" : "medium"}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        ({totalReviews} Reviews)
                                    </Typography>
                                </Stack>

                                <Typography
                                    variant={isMobile ? "h5" : "h4"}
                                    fontWeight={700}
                                    color="primary.main"
                                >
                                    ₹{product.price}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.7 }}
                                >
                                    {product.description}
                                </Typography>

                                {/* Size Selector */}
                                {showSizeSelector && (
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            mb={1.5}
                                        >
                                            Select Size{" "}
                                            {isSizeRequired && (
                                                <Typography
                                                    component="span"
                                                    color="error.main"
                                                >
                                                    *
                                                </Typography>
                                            )}
                                            {selectedSize && (
                                                <Typography
                                                    component="span"
                                                    color="primary.main"
                                                    fontWeight={700}
                                                >
                                                    {" "}
                                                    ({selectedSize})
                                                </Typography>
                                            )}
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={selectedSize}
                                            exclusive
                                            onChange={(e, newSize) => setSelectedSize(newSize)}
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 1,
                                            }}
                                        >
                                            {availableSizes.map((size) => (
                                                <ToggleButton
                                                    key={size}
                                                    value={size}
                                                    disabled={isUnavailable}
                                                    sx={{
                                                        minWidth: { xs: 45, md: 55 },
                                                        height: { xs: 40, md: 45 },
                                                        borderRadius: 1.5,
                                                        fontWeight: 600,
                                                        border: "1.5px solid",
                                                        borderColor: "divider",
                                                        "&.Mui-selected": {
                                                            bgcolor: "primary.main",
                                                            color: "white",
                                                            borderColor: "primary.main",
                                                            "&:hover": {
                                                                bgcolor: "primary.dark",
                                                            },
                                                        },
                                                        "&:hover": {
                                                            borderColor: "primary.main",
                                                            bgcolor: alpha(
                                                                theme.palette.primary.main,
                                                                0.04
                                                            ),
                                                        },
                                                    }}
                                                >
                                                    {size}
                                                </ToggleButton>
                                            ))}
                                        </ToggleButtonGroup>
                                    </Box>
                                )}

                                {/* Stock indicator */}
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1.5,
                                        bgcolor: isUnavailable
                                            ? alpha(theme.palette.error.main, 0.08)
                                            : liveStock <= 0
                                                ? alpha(theme.palette.error.main, 0.08)
                                                : liveStock <= 10
                                                    ? alpha(theme.palette.warning.main, 0.08)
                                                    : alpha(theme.palette.success.main, 0.08),
                                        border: "1px solid",
                                        borderColor: isUnavailable
                                            ? alpha(theme.palette.error.main, 0.3)
                                            : liveStock <= 0
                                                ? alpha(theme.palette.error.main, 0.2)
                                                : liveStock <= 10
                                                    ? alpha(theme.palette.warning.main, 0.2)
                                                    : alpha(theme.palette.success.main, 0.2),
                                    }}
                                >
                                    <Typography
                                        fontWeight={600}
                                        color={
                                            isUnavailable
                                                ? "error.main"
                                                : liveStock <= 0
                                                    ? "error.main"
                                                    : liveStock <= 10
                                                        ? "warning.main"
                                                        : "success.main"
                                        }
                                    >
                                        {isUnavailable
                                            ? "This product is no longer available"
                                            : liveStock <= 0
                                                ? "⚠️ Out of stock"
                                                : liveStock <= 10
                                                    ? `⚡ Only ${liveStock} left in stock`
                                                    : "✓ In Stock"}
                                    </Typography>
                                </Box>

                                {/* Quantity + actions */}
                                <Stack spacing={2} mt={2}>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            Quantity:
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ minWidth: 36, height: 36 }}
                                            disabled={isUnavailable}
                                            onClick={() =>
                                                setQuantity((q) => Math.max(1, q - 1))
                                            }
                                        >
                                            -
                                        </Button>
                                        <Typography
                                            fontWeight={600}
                                            sx={{
                                                minWidth: 30,
                                                textAlign: "center",
                                            }}
                                        >
                                            {quantity}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ minWidth: 36, height: 36 }}
                                            disabled={isUnavailable || liveStock <= 0}
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
                                                borderRadius: 1.5,
                                            }}
                                            onClick={handleBuyNowNavigate}
                                            disabled={disabledActions}
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
                                            disabled={disabledActions}
                                        >
                                            Add to Cart
                                        </Button>
                                    )}
                                    <Stack direction="row" spacing={2} mt={1}>

                                        {/* Add to Wishlist (50%) */}
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            sx={{
                                                height: 48,
                                                borderRadius: 1.5,
                                                textTransform: "none",
                                                fontWeight: 600,
                                            }}
                                            onClick={() => {
                                                if (!loggedInUser) {
                                                    return navigate("/login");
                                                }


                                                if (isUnavailable) return;

                                                if (isInWishlist) {
                                                    const existing = wishlistItems.find(
                                                        (i) => i.product && i.product._id === id
                                                    );
                                                    if (existing) {
                                                        dispatch(deleteWishlistItemByIdAsync(existing._id));
                                                    }
                                                } else {
                                                    dispatch(
                                                        createWishlistItemAsync({
                                                            user: loggedInUser._id,
                                                            product: id,
                                                        })
                                                    );
                                                }
                                            }}
                                            startIcon={
                                                isInWishlist ? <Favorite sx={{ color: "red" }} /> : <FavoriteBorder />
                                            }
                                        >
                                            Wishlist
                                        </Button>

                                        {/* Share Product (50%) */}
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            sx={{
                                                height: 48,
                                                borderRadius: 1.5,
                                                textTransform: "none",
                                                fontWeight: 600,
                                            }}
                                            startIcon={<ShareIcon />}
                                            onClick={handleShareProduct}
                                        >
                                            Share
                                        </Button>
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