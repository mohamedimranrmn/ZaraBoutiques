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

export const ProductCard = ({
                                id,
                                title,
                                price,              // discounted price
                                originalPrice = null,
                                discountPercentage = 0,
                                thumbnail,
                                brand,
                                handleAddRemoveFromWishlist,
                                isWishlistCard = false,
                                isAdminCard = false
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

        // Always redirect to product details for proper add-to-cart flow
        navigate(`/product-details/${id}`);
    };



    const buyNow = (e) => {
        e.stopPropagation();
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
                }
            }
        });
    };

    const showOriginal = originalPrice && originalPrice > price;
    const showDiscount = discountPercentage > 0;

    return (
        <Paper
            elevation={1}
            component={motion.div}
            whileHover={{ scale: 1.01 }}
            sx={{
                width: "100%",
                borderRadius: 2,
                p: 1.25,
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column"
            }}
            onClick={() => navigate(`/product-details/${id}`)}
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

            {/* Image */}
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
                        width: "100%"
                    }}
                >
                    {title}
                </Typography>

                {!isAdminCard && (
                    <Checkbox
                        checked={isInWishlist}
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

            {/* Price */}
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

            {/* BUTTON (CRITICAL LOGIC) */}
            {!isWishlistCard && !isAdminCard && (
                isInCart ? (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product-details/${id}`);
                        }}
                        sx={{
                            mt: 1,
                            py: 0.75,              // smaller height
                            fontSize: "0.8rem",    // smaller text
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: 1.2,
                            minHeight: 36,         // enforce single-line button
                        }}

                    >
                        Buy Now
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={addToCart}
                        sx={{
                            mt: 1,
                            py: 0.75,              // smaller height
                            fontSize: "0.8rem",    // smaller text
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: 1.2,
                            minHeight: 36,         // enforce single-line button
                        }}
                    >
                        Add to Cart
                    </Button>
                )
            )}
        </Paper>
    );
};
