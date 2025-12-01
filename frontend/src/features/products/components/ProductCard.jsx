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
import { selectCartItems, addToCartAsync } from "../../cart/CartSlice";
import { selectWishlistItems } from "../../wishlist/WishlistSlice";
import { selectLoggedInUser } from "../../auth/AuthSlice";

export const ProductCard = ({
                                id,
                                title,
                                price,                  // discounted price
                                originalPrice = null,   // original MRP
                                discountPercentage = 0,
                                thumbnail,
                                brand,
                                isWishlistCard = false,
                                isAdminCard = false,
                                handleAddRemoveFromWishlist
                            }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const cartItems = useSelector(selectCartItems);
    const wishlistItems = useSelector(selectWishlistItems);
    const loggedInUser = useSelector(selectLoggedInUser);

    const inCart = cartItems.some((i) => i.product._id === id);
    const inWishlist = wishlistItems.some((i) => i.product._id === id);

    const showOriginal =
        originalPrice &&
        originalPrice > price;      // IMPORTANT FIX

    const showDiscount =
        discountPercentage &&
        discountPercentage > 0;     // IMPORTANT FIX

    const addToCart = (e) => {
        e.stopPropagation();
        if (!loggedInUser) return navigate("/login");
        dispatch(addToCartAsync({ user: loggedInUser._id, product: id }));
    };

    return (
        <Paper
            elevation={1}
            component={motion.div}
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate(`/product-details/${id}`)}
            sx={{
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                p: 1.25,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                position: "relative"
            }}
        >

            {/* Discount Badge */}
            {showDiscount && (
                <Box sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    bgcolor: "error.main",
                    color: "white",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    px: 1,
                    py: 0.3,
                    borderRadius: 1.5,
                    zIndex: 5
                }}>
                    -{discountPercentage}%
                </Box>
            )}

            {/* IMAGE */}
            <Box
                sx={{
                    width: "100%",
                    aspectRatio: "1/1",
                    borderRadius: 1.5,
                    overflow: "hidden",
                    bgcolor: "grey.100",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <img
                    src={thumbnail}
                    alt={title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: 8
                    }}
                />
            </Box>

            {/* Title + Wishlist */}
            <Stack direction="row" justifyContent="space-between" mt={1}>
                <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                        lineHeight: 1.3
                    }}
                >
                    {title}
                </Typography>

                {!isAdminCard && (
                    <Checkbox
                        checked={inWishlist}
                        icon={<FavoriteBorder />}
                        checkedIcon={<Favorite sx={{ color: "red" }} />}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAddRemoveFromWishlist(e, id)}
                        sx={{ p: 0.3 }}
                    />
                )}
            </Stack>

            {/* Brand */}
            <Typography variant="caption" color="text.secondary">
                {brand}
            </Typography>

            {/* Price Row */}
            <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                <Typography variant="h6" fontWeight={700}>
                    ₹{price}
                </Typography>

                {showOriginal && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                    >
                        ₹{originalPrice}
                    </Typography>
                )}
            </Stack>

            {/* Add to cart */}
            {!isWishlistCard && !isAdminCard && (
                <Button
                    variant="contained"
                    onClick={addToCart}
                    sx={{
                        mt: 1,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: "black",
                        color: "white",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "0.85rem",
                        "&:hover": { bgcolor: "grey.900" }
                    }}
                >
                    {inCart ? "Go to Cart" : "Add to Cart"}
                </Button>
            )}
        </Paper>
    );
};
