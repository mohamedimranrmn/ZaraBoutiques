import {
    Paper,
    Stack,
    Typography,
    Checkbox,
    useMediaQuery,
    useTheme,
    Box,
    Button
} from "@mui/material";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Favorite from "@mui/icons-material/Favorite";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectWishlistItems } from "../../wishlist/WishlistSlice";
import { selectCartItems, addToCartAsync } from "../../cart/CartSlice";
import { selectLoggedInUser } from "../../auth/AuthSlice";
import Skeleton from "@mui/material/Skeleton";

export const ProductCard = ({
                                id,
                                title,
                                price,
                                thumbnail,
                                brand,
                                handleAddRemoveFromWishlist,
                                isWishlistCard = false,
                                isAdminCard = false,
                                loading = false,
                            }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const wishlistItems = useSelector(selectWishlistItems);
    const cartItems = useSelector(selectCartItems);
    const loggedInUser = useSelector(selectLoggedInUser);

    const isInWishlist = wishlistItems.some((item) => item.product._id === id);
    const isInCart = cartItems.some((item) => item.product._id === id);

    const addToCart = (e) => {
        e.stopPropagation();
        if (!loggedInUser) {
            navigate("/login");
            return;
        }
        dispatch(addToCartAsync({ user: loggedInUser?._id, product: id }));
    };

    const handleBuyNow = (e) => {
        e.stopPropagation();
        // Navigate to checkout with only this product (buyNow flow)
        navigate("/checkout", {
            state: {
                buyNow: true,
                product: {
                    _id: id,
                    title,
                    price,
                    thumbnail,
                    brand,
                    quantity: 1,
                },
            },
        });
    };

    if (loading) {
        return (
            <Paper elevation={1} sx={{ p: 1.25, borderRadius: 2 }}>
                <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: "1/1", borderRadius: 1 }} />
                <Skeleton width="60%" height={24} sx={{ mt: 1 }} />
                <Skeleton width="40%" height={20} sx={{ mt: 0.5 }} />
            </Paper>
        );
    }

    return (
        <Paper
            elevation={1}
            component={motion.div}
            whileHover={{ scale: 1.01 }}
            sx={{
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                p: 1,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                mt: 2, // margin-top to avoid touching banner on hover
                transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onClick={() => navigate(`/product-details/${id}`)}
        >
            {/* Image */}
            <Box
                sx={{
                    width: "100%",
                    aspectRatio: "1/1",
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Box
                    component="img"
                    src={thumbnail}
                    alt={title}
                    sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
                />
            </Box>

            {/* Details */}
            <Stack spacing={1} mt={1} flex={1}>
                {/* Title + Wishlist */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography
                        variant="body1"
                        fontWeight={600}
                        sx={{
                            lineHeight: 1.25,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            flex: 1,
                        }}
                    >
                        {title}
                    </Typography>

                    {!isAdminCard && (
                        <motion.div whileHover={{ scale: 1.12 }}>
                            <Checkbox
                                checked={isInWishlist}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleAddRemoveFromWishlist(e, id)}
                                icon={<FavoriteBorder />}
                                checkedIcon={<Favorite sx={{ color: "red" }} />}
                                sx={{ p: 0.5 }}
                            />
                        </motion.div>
                    )}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                    {brand}
                </Typography>

                {/* PRICE */}
                <Typography variant="h6" fontWeight={700}>
                    ₹{price}
                </Typography>

                {/* ACTION BUTTON - single button visible (Add to Cart OR Buy Now) */}
                {!isWishlistCard && !isAdminCard && (
                    isInCart ? (
                        <Button
                            component={motion.button}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.99 }}
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleBuyNow}
                            sx={{
                                mt: 1,
                                py: isMobile ? 1.1 : 1.3,
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: isMobile ? "0.82rem" : "0.9rem",
                                whiteSpace: "nowrap",        // force single line
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            Buy Now
                        </Button>
                    ) : (
                        <Button
                            component={motion.button}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.99 }}
                            variant="contained"
                            fullWidth
                            onClick={addToCart}
                            sx={{
                                mt: 1,
                                py: isMobile ? 1.1 : 1.3,
                                bgcolor: "black",
                                color: "white",
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: isMobile ? "0.82rem" : "0.9rem",
                                whiteSpace: "nowrap",        // ⬅️ forces text into a single line
                                overflow: "hidden",          // ⬅️ prevents spilling out
                                textOverflow: "ellipsis",    // ⬅️ safety for small screens
                                "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                            }}
                        >
                            Add to Cart
                        </Button>

                    )
                )}
            </Stack>
        </Paper>
    );
};
