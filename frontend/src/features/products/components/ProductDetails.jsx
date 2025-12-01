// frontend/src/features/Product/ProductDetails.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
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
    Button,
    IconButton,
    Stack,
    Typography,
    useMediaQuery,
    Container,
    alpha,
    Skeleton,
    Rating,
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

// small helper to show unique toasts once per status
const useOnceToast = (status, successMsg, errorMsg, resetAction) => {
    const dispatch = useDispatch();
    const prevRef = useRef(null);
    useEffect(() => {
        if (prevRef.current !== status) {
            if (status === "fulfilled") {
                toast.success(successMsg);
                dispatch(resetAction());
            } else if (status === "rejected") {
                toast.error(errorMsg);
                dispatch(resetAction());
            }
        }
        prevRef.current = status;
    }, [status, dispatch, resetAction, successMsg, errorMsg]);
};

export const ProductDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const product = useSelector(selectSelectedProduct);
    const productFetchStatus = useSelector(selectProductFetchStatus);
    const reviews = useSelector(selectReviews);

    const loggedInUser = useSelector(selectLoggedInUser);
    const cartItems = useSelector(selectCartItems);
    const cartItemAddStatus = useSelector(selectCartItemAddStatus);

    const wishlistItems = useSelector(selectWishlistItems) || [];
    const wishlistItemAddStatus = useSelector(selectWishlistItemAddStatus);
    const wishlistItemDeleteStatus = useSelector(selectWishlistItemDeleteStatus);

    // local UI state
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [liveStock, setLiveStock] = useState(0);
    const [isUnavailable, setIsUnavailable] = useState(false);
    const unavailableToastShownRef = useRef(false);

    // derived
    const isInCart = cartItems.some((item) => item.product && item.product._id === id);
    const isInWishlist = Array.isArray(wishlistItems)
        ? wishlistItems.some((item) => item.product && item.product._id === id)
        : false;

    const totalReviews = reviews?.length || 0;
    const avgRating = totalReviews
        ? Math.round(reviews.reduce((a, b) => a + b.rating, 0) / totalReviews)
        : 0;

    // sizes ordering rules
    const clothingOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
    const footwearOrder = ["4", "5", "6", "7", "8", "9", "10", "11", "12"];

    // normalize sizes and sort intelligently
    const availableSizes = product?.sizes || [];
    const sortedSizes = useMemo(() => {
        if (!availableSizes || availableSizes.length === 0) return [];

        // if sizes are numeric-ish -> footwear
        const areNumeric = availableSizes.every((s) => /^[0-9]+$/.test(String(s)));
        if (areNumeric) {
            // sort by footwearOrder, falling back to numeric sort
            return [...availableSizes].sort(
                (a, b) =>
                    (footwearOrder.indexOf(String(a)) === -1 ? 999 : footwearOrder.indexOf(String(a))) -
                    (footwearOrder.indexOf(String(b)) === -1 ? 999 : footwearOrder.indexOf(String(b)))
            );
        }

        // otherwise, use clothingOrder if present
        const hasKnown = availableSizes.some((s) => clothingOrder.includes(String(s)));
        if (hasKnown) {
            return [...availableSizes].sort(
                (a, b) =>
                    (clothingOrder.indexOf(String(a)) === -1 ? 999 : clothingOrder.indexOf(String(a))) -
                    (clothingOrder.indexOf(String(b)) === -1 ? 999 : clothingOrder.indexOf(String(b)))
            );
        }

        // fallback: alphabetical
        return [...availableSizes].sort((a, b) => String(a).localeCompare(String(b)));
    }, [availableSizes]);

    // price / discount
    const discountPct = product?.discountPercentage || 0;
    const discountedPrice = discountPct
        ? +(product.price - (product.price * discountPct) / 100).toFixed(2)
        : product?.price;

    // small helpers for polling stock
    useEffect(() => {
        if (product) setLiveStock(product.stockQuantity ?? 0);
    }, [product]);

    useEffect(() => {
        if (!product?._id || product?.isDeleted || isUnavailable) return;

        let isMounted = true;

        const refreshStock = async () => {
            try {
                const data = await fetchProductStock(product._id);
                if (!isMounted) return;
                if (typeof data.stockQuantity === "number" && data.stockQuantity !== liveStock) {
                    setLiveStock(data.stockQuantity);
                    toast.info(`Stock updated — ${data.stockQuantity} left`, {
                        toastId: `stock-update-${product._id}`,
                    });
                }
            } catch (err) {
                // silent
                // console.log("stock polling failed", err);
            }
        };

        refreshStock();
        const interval = setInterval(refreshStock, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?._id, product?.isDeleted, isUnavailable, liveStock]);

    // toast helpers for cart/wishlist operations (avoid duplicates)
    useOnceToast(cartItemAddStatus, "Product added to cart", "Failed to add to cart", resetCartItemAddStatus);
    useOnceToast(wishlistItemAddStatus, "Product added to wishlist", "Failed to add to wishlist", resetWishlistItemAddStatus);
    useOnceToast(wishlistItemDeleteStatus, "Product removed from wishlist", "Failed removing wishlist item", resetWishlistItemDeleteStatus);

    // fetch product and reviews on mount / id change
    useEffect(() => {
        if (id) {
            dispatch(fetchProductByIdAsync(id));
            dispatch(fetchReviewsByProductIdAsync(id));
        }
    }, [id, dispatch]);

    // handle unavailable flag and single toast
    useEffect(() => {
        const deletedFromStatus = productFetchStatus === "rejected" && !product && !isUnavailable;
        const deletedFromFlag = !!product?.isDeleted;
        const nowUnavailable = deletedFromStatus || deletedFromFlag;
        if (nowUnavailable) {
            setIsUnavailable(true);
            if (!unavailableToastShownRef.current) {
                toast.error("This product is no longer available");
                unavailableToastShownRef.current = true;
            }
        } else if (product && !product.isDeleted && productFetchStatus === "fulfilled") {
            setIsUnavailable(false);
        }
    }, [productFetchStatus, product, isUnavailable]);

    // cleanup
    useEffect(() => {
        return () => {
            dispatch(clearSelectedProduct());
            dispatch(resetProductFetchStatus());
            dispatch(resetReviewFetchStatus());
        };
    }, [dispatch]);

    // share function: do not duplicate link; prefer sharing image as file if possible
    const handleShareProduct = async () => {
        if (!product) return;
        const firstImage = product.images?.[0] || product.thumbnail || "";
        const productUrl = `${window.location.origin}/product-details/${product._id}`;

        // build text without URL to avoid duplication
        const shareText = `${product.title}\nPrice: ₹${discountPct ? discountedPrice : product.price}\n\n${product.description?.slice(0, 150) || ""}`;

        if (navigator.share) {
            // try to include image blob if supported
            try {
                if (firstImage) {
                    // fetch image blob
                    const res = await fetch(firstImage, { mode: "cors" });
                    const blob = await res.blob();
                    // create file from blob (web share files supported on some platforms)
                    const file = new File([blob], "product.jpg", { type: blob.type });

                    await navigator.share({
                        title: product.title,
                        text: shareText,
                        url: productUrl, // url field is supported and will be shown by many apps
                        files: [file],
                    });
                } else {
                    // no image
                    await navigator.share({
                        title: product.title,
                        text: shareText,
                        url: productUrl,
                    });
                }
            } catch (err) {
                // fallback: share without files (or copy)
                try {
                    await navigator.share({
                        title: product.title,
                        text: shareText,
                        url: productUrl,
                    });
                } catch (err2) {
                    // last fallback: copy to clipboard
                    try {
                        await navigator.clipboard.writeText(`${shareText}\n\n${productUrl}`);
                        toast.info("Product link copied to clipboard");
                    } catch (_err) {
                        toast.error("Sharing failed");
                    }
                }
            }
        } else {
            // no navigator.share -> copy fallback
            try {
                await navigator.clipboard.writeText(`${shareText}\n\n${productUrl}`);
                toast.info("Product link copied to clipboard");
            } catch (err) {
                toast.error("Unable to copy product link");
            }
        }
    };

    // add to cart
    const handleAddToCart = () => {
        if (!loggedInUser) {
            toast.error("Please login to add items to cart");
            return;
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
        if (sortedSizes.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }

        dispatch(addToCartAsync({
            user: loggedInUser._id,
            product: id,
            quantity,
            size: selectedSize || null,
            price: discountedPrice,  // ✔ FIX
        }));
        // reset selection after add
        setQuantity(1);
        setSelectedSize(null);
    };

    const handleBuyNowNavigate = () => {
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
        if (sortedSizes.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }

        const productForCheckout = {
            _id: product._id,
            product: {
                _id: product._id,
                title: product.title,
                price: discountedPrice,
                thumbnail: product.images?.[0] || product.thumbnail,
                brand: { name: product.brand?.name },
                stockQuantity: liveStock,
            },
            quantity,
            size: selectedSize,
        };

        navigate("/checkout", { state: { selectedItems: [productForCheckout] } });
    };

    const disabledActions = isUnavailable || liveStock <= 0 || (sortedSizes.length > 0 && !selectedSize);

    // image gallery: thumbnail strip (Option A)
    const images = product?.images?.length ? product.images : product?.thumbnail ? [product.thumbnail] : [];
    const maxSteps = images.length;

    // skeleton while loading
    if (productFetchStatus === "pending") {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: alpha(theme.palette.grey[50], 0.3) }}>
                <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                    <Stack direction={isMobile ? "column" : "row"} spacing={4} width="100%">
                        <Stack width={isMobile ? "100%" : "50%"}>
                            <Skeleton variant="rectangular" sx={{ width: "100%", height: isMobile ? 260 : 420, borderRadius: 2 }} />
                        </Stack>
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

    if (!product && isUnavailable) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: alpha(theme.palette.grey[50], 0.3) }}>
                <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
                    <Stack spacing={3} alignItems="center">
                        <Typography variant="h5" fontWeight={700} color="error.main" textAlign="center">
                            This product is no longer available.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={480}>
                            It may have been removed or is temporarily unavailable. You can continue shopping to explore other products.
                        </Typography>
                        <Button variant="contained" component={Link} to="/" sx={{ textTransform: "none", px: 3, py: 1.1 }}>
                            Continue Shopping
                        </Button>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4} width="100%" sx={{ mt: 4 }}>
                            <Stack width={isMobile ? "100%" : "50%"}>
                                <Skeleton variant="rectangular" sx={{ width: "100%", height: isMobile ? 260 : 420, borderRadius: 2 }} />
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

    if (!product) {
        return (
            <Stack minHeight="60vh" alignItems="center" justifyContent="center" spacing={2}>
                <Typography variant="h6">Unable to load this product at the moment.</Typography>
                <Button variant="contained" component={Link} to="/" sx={{ textTransform: "none" }}>
                    Continue Shopping
                </Button>
            </Stack>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: alpha(theme.palette.grey[50], 0.3) }}>
            <Helmet>
                <title>{product.title}</title>
                <meta property="og:title" content={product.title} />
                <meta property="og:description" content={product.description?.slice(0, 150) || ""} />
                <meta property="og:image" content={images[0] || ""} />
                <meta property="og:url" content={`${window.location.origin}/product-details/${product._id}`} />
                <meta property="og:type" content="product" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={product.title} />
                <meta name="twitter:description" content={product.description?.slice(0, 150) || ""} />
                <meta name="twitter:image" content={images[0] || ""} />
            </Helmet>

            {/* Desktop top bar */}
            {!isMobile && (
                <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "white", py: 2.5 }}>
                    <Container maxWidth="lg">
                        <Stack direction="row" alignItems="center" gap={2}>
                            <IconButton onClick={() => navigate(-1)} sx={{ border: "1px solid", borderColor: "divider" }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h5" fontWeight={700}>
                                Product Details
                            </Typography>
                        </Stack>
                    </Container>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                {/* Mobile back */}
                {isMobile && (
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
                        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", boxShadow: 1 }}>
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" fontWeight={700}>
                            Product Details
                        </Typography>
                    </Stack>
                )}

                {isUnavailable && (
                    <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.06), border: "1px solid", borderColor: alpha(theme.palette.error.main, 0.3) }}>
                        <Typography variant="body1" fontWeight={600} color="error.main">This product is no longer available.</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            You can still view details but cannot add to cart or wishlist.
                        </Typography>
                    </Box>
                )}

                <Stack direction={isMobile ? "column" : "row"} spacing={4} width="100%">
                    {/* IMAGE COLUMN */}
                    {/* IMAGE COLUMN */}
                    <Stack width={isMobile ? "100%" : "50%"} spacing={2}>
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
                                {images.map((img, i) => (
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
                                            alt={`${product.title} ${i}`}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                            }}
                                        />
                                    </Box>
                                ))}
                            </AutoPlaySwipeableViews>

                            {maxSteps > 1 && (
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
                                            onClick={() => setActiveStep((s) => Math.min(s + 1, maxSteps - 1))}
                                            disabled={activeStep === maxSteps - 1}
                                        >
                                            <KeyboardArrowRightIcon />
                                        </IconButton>
                                    }
                                    backButton={
                                        <IconButton
                                            size="small"
                                            onClick={() => setActiveStep((s) => Math.max(s - 1, 0))}
                                            disabled={activeStep === 0}
                                        >
                                            <KeyboardArrowLeftIcon />
                                        </IconButton>
                                    }
                                />
                            )}
                        </Box>
                    </Stack>
                    {/* DETAILS COLUMN */}
                    <Stack width={isMobile ? "100%" : "50%"} spacing={2}>
                        <Box sx={{ bgcolor: "white", p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                            <Stack spacing={2.5}>
                                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700}>{product.title}</Typography>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Rating value={avgRating} readOnly size={isMobile ? "small" : "medium"} />
                                    <Typography variant="body2" color="text.secondary">({totalReviews} Reviews)</Typography>
                                </Stack>

                                {/* Price + discount */}
                                {discountPct > 0 ? (
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} color="primary.main">₹{discountedPrice}</Typography>
                                            <Typography variant="body1" sx={{ textDecoration: "line-through", color: "text.secondary" }}>₹{product.price}</Typography>
                                            <Box sx={{ bgcolor: "error.main", color: "white", px: 1.5, py: 0.3, borderRadius: 1, fontWeight: 700, fontSize: "0.85rem" }}>
                                                {discountPct}% OFF
                                            </Box>
                                        </Stack>
                                        {/* optional small savings info */}
                                        <Typography variant="caption" color="text.secondary">You save ₹{(product.price - discountedPrice).toFixed(2)}</Typography>
                                    </Stack>
                                ) : (
                                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} color="primary.main">₹{product.price}</Typography>
                                )}

                                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{product.description}</Typography>

                                {/* Size picker: redesigned to match the provided pill-style (selected black, others light) */}
                                {sortedSizes.length > 0 && (
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} mb={1.5}>
                                            Size {product.requiresSize ? <Typography component="span" color="error.main">*</Typography> : null}
                                        </Typography>

                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {sortedSizes.map((size) => {
                                                const isSelected = selectedSize === size;
                                                return (
                                                    <Box
                                                        key={size}
                                                        onClick={() => !isUnavailable && setSelectedSize(size)}
                                                        sx={{
                                                            cursor: isUnavailable ? "not-allowed" : "pointer",
                                                            px: 2.25,
                                                            py: 0.9,
                                                            borderRadius: 1,
                                                            minWidth: 52,
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            fontWeight: 700,
                                                            fontSize: "0.95rem",
                                                            border: isSelected ? "none" : "1px solid",
                                                            borderColor: isSelected ? "transparent" : "divider",
                                                            backgroundColor: isSelected ? "black" : "white",
                                                            color: isSelected ? "white" : "text.primary",
                                                            transition: "all 0.18s ease",
                                                            "&:hover": {
                                                                transform: isUnavailable ? "none" : "translateY(-2px)",
                                                                boxShadow: isSelected ? "" : `0 6px 18px ${alpha(theme.palette.grey[900], 0.04)}`,
                                                            },
                                                        }}
                                                    >
                                                        {size}
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Stock indicator */}
                                <Box sx={{
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
                                }}>
                                    <Typography fontWeight={600} color={
                                        isUnavailable ? "error.main" :
                                            liveStock <= 0 ? "error.main" :
                                                liveStock <= 10 ? "warning.main" : "success.main"
                                    }>
                                        {isUnavailable ? "This product is no longer available" :
                                            liveStock <= 0 ? "⚠️ Out of stock" :
                                                liveStock <= 10 ? `⚡ Only ${liveStock} left in stock` : "✓ In Stock"}
                                    </Typography>
                                </Box>

                                {/* quantity + actions */}
                                <Stack spacing={2} mt={2}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" fontWeight={600}>Quantity:</Typography>
                                        <Button variant="outlined" size="small" sx={{ minWidth: 36, height: 36 }} disabled={isUnavailable} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</Button>
                                        <Typography fontWeight={600} sx={{ minWidth: 30, textAlign: "center" }}>{quantity}</Typography>
                                        <Button variant="contained" size="small" sx={{ minWidth: 36, height: 36 }} disabled={isUnavailable || liveStock <= 0} onClick={() => {
                                            if (quantity < liveStock) setQuantity(quantity + 1);
                                            else toast.error(liveStock > 0 ? `Only ${liveStock} left in stock` : "Out of stock");
                                        }}>+</Button>
                                    </Stack>

                                    {/* Primary action */}
                                    {isInCart ? (
                                        <Button fullWidth variant="contained" color="primary" size="large" sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600, borderRadius: 1.5 }} onClick={handleBuyNowNavigate} disabled={disabledActions}>Buy Now</Button>
                                    ) : (
                                        <Button fullWidth variant="contained" size="large" sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600, bgcolor: "black", borderRadius: 1.5, "&:hover": { bgcolor: "rgba(0,0,0,0.85)" } }} onClick={handleAddToCart} disabled={disabledActions}>Add to Cart</Button>
                                    )}

                                    <Stack direction="row" spacing={2} mt={1}>
                                        <Button variant="outlined" fullWidth sx={{ height: 48, borderRadius: 1.5, textTransform: "none", fontWeight: 600 }} onClick={() => {
                                            if (!loggedInUser) {
                                                toast.error("Please login to manage wishlist");
                                                return;
                                            }
                                            if (isUnavailable) return;
                                            if (isInWishlist) {
                                                const existing = wishlistItems.find((i) => i.product && i.product._id === id);
                                                if (existing) dispatch(deleteWishlistItemByIdAsync(existing._id));
                                            } else {
                                                dispatch(createWishlistItemAsync({ user: loggedInUser._id, product: id }));
                                            }
                                        }} startIcon={isInWishlist ? <Favorite sx={{ color: "red" }} /> : <FavoriteBorder />}>Wishlist</Button>

                                        <Button variant="outlined" fullWidth sx={{ height: 48, borderRadius: 1.5, textTransform: "none", fontWeight: 600 }} startIcon={<ShareIcon />} onClick={handleShareProduct}>Share</Button>
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

export default ProductDetails;
