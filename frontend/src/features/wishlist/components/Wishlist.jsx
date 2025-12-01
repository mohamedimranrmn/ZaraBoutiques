import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";

import {
  deleteWishlistItemByIdAsync,
  updateWishlistItemByIdAsync,
  resetWishlistFetchStatus,
  resetWishlistItemAddStatus,
  resetWishlistItemDeleteStatus,
  resetWishlistItemUpdateStatus,
  selectWishlistFetchStatus,
  selectWishlistItems,
} from "../WishlistSlice";

import {
  selectLoggedInUser
} from "../../auth/AuthSlice";

import {
  selectCartItems
} from "../../cart/CartSlice";

import { emptyWishlistAnimation, loadingAnimation } from "../../../assets";
import { toast } from "react-toastify";

export const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector(selectWishlistItems);
  const wishlistFetchStatus = useSelector(selectWishlistFetchStatus);
  const cartItems = useSelector(selectCartItems);
  const loggedInUser = useSelector(selectLoggedInUser);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState("");

  const handleRemove = (id) => {
    dispatch(deleteWishlistItemByIdAsync(id));
  };

  const handleRedirectToCartFlow = (product) => {
    if (!product?._id) {
      toast.error("Product no longer available");
      return;
    }
    navigate(`/product-details/${product._id}`);
  };

  const handleSaveNote = (id) => {
    dispatch(updateWishlistItemByIdAsync({ _id: id, note: editValue }));
    setEditIndex(-1);
    setEditValue("");
  };

  useEffect(() => {
    return () => {
      dispatch(resetWishlistFetchStatus());
      dispatch(resetWishlistItemAddStatus());
      dispatch(resetWishlistItemDeleteStatus());
      dispatch(resetWishlistItemUpdateStatus());
    };
  }, [dispatch]);

  /* -----------------------------------------
      LOADING
  ------------------------------------------ */
  if (wishlistFetchStatus === "pending") {
    return (
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <Lottie animationData={loadingAnimation} style={{ width: 200 }} />
        </Stack>
    );
  }

  /* -----------------------------------------
      EMPTY
  ------------------------------------------ */
  if (!wishlistItems?.length) {
    return (
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <Lottie animationData={emptyWishlistAnimation} style={{ width: 280 }} />
          <Typography variant="h6" fontWeight={600}>Your wishlist is empty</Typography>
          <Typography color="text.secondary" textAlign="center">
            Save your favorite items to buy later
          </Typography>
          <Button
              component={Link}
              to="/"
              variant="contained"
              sx={{ mt: 2, textTransform: "none", borderRadius: 1.5 }}
          >
            Start Shopping
          </Button>
        </Stack>
    );
  }

  /* -----------------------------------------
      MAIN LIST
  ------------------------------------------ */
  return (
      <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", pb: 4 }}>
        {/* HEADER */}
        <Box sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e5e7eb",
          py: 2.5,
          px: 3,
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton component={Link} to="/" sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
              My Wishlist
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2, mt: 3 }}>
          <Stack spacing={2}>
            {wishlistItems.map((item, index) => {
              const product = item.product;
              const isDeleted = !product;
              const inCart = product
                  ? cartItems.some(c => c.product?._id === product._id)
                  : false;

              return (
                  <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                  >
                    <Paper sx={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                      overflow: "hidden",
                      p: 1.5
                    }}>
                      <Grid container spacing={2}>

                        {/* IMAGE */}
                        <Grid item xs={4} sm={3}>
                          <Box sx={{
                            width: "100%",
                            height: isMobile ? 120 : 150,
                            borderRadius: 1.5,
                            overflow: "hidden",
                            bgcolor: "grey.100"
                          }}>
                            <img
                                src={product?.thumbnail || "/placeholder.png"}
                                alt={product?.title || "Unavailable"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  padding: 6
                                }}
                            />
                          </Box>
                        </Grid>

                        {/* PRODUCT DETAILS */}
                        <Grid item xs={8} sm={6}>
                          <Stack spacing={1}>
                            <Typography variant="caption" color="primary">
                              {product?.brand?.name || "Unknown brand"}
                            </Typography>

                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                            >
                              {product?.title || "Product Removed"}
                            </Typography>

                            {product?.price ? (
                                <Typography fontWeight={700}>
                                  ₹{product.price}
                                </Typography>
                            ) : (
                                <Typography color="error.main" fontWeight={600}>
                                  Product unavailable
                                </Typography>
                            )}

                            {/* NOTE */}
                            <Box>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2" fontWeight={600}>Note</Typography>

                                {editIndex !== index && (
                                    <IconButton size="small" onClick={() => {
                                      setEditIndex(index);
                                      setEditValue(item.note || "");
                                    }}>
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                )}
                              </Stack>

                              {editIndex === index ? (
                                  <Stack spacing={1}>
                                    <TextField
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        multiline
                                        rows={2}
                                        size="small"
                                    />
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                      <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() => handleSaveNote(item._id)}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => setEditIndex(-1)}
                                      >
                                        Cancel
                                      </Button>
                                    </Stack>
                                  </Stack>
                              ) : (
                                  <Typography
                                      variant="body2"
                                      sx={{ mt: 0.5, color: item.note ? "text.primary" : "text.secondary" }}
                                  >
                                    {item.note || "No note added"}
                                  </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Grid>

                        {/* ACTION BUTTONS */}
                        <Grid item xs={12} sm={3}>
                          <Stack spacing={1.2} sx={{ mt: 1 }}>

                            {/* ADD TO CART / IN CART */}
                            {isDeleted ? (
                                <Button
                                    fullWidth
                                    disabled
                                    variant="outlined"
                                    sx={{ textTransform: "none", borderRadius: 1.2 }}
                                >
                                  Not Available
                                </Button>
                            ) : inCart ? (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="success"
                                    component={Link}
                                    to="/cart"
                                    startIcon={<CheckCircleIcon />}
                                    sx={{ textTransform: "none", borderRadius: 1.2, fontSize: "0.78rem" }}
                                >
                                  In Cart
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<ShoppingCartOutlinedIcon />}
                                    onClick={() => handleRedirectToCartFlow(product)}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: 1.2,
                                      fontSize: "0.8rem",
                                      py: 0.8
                                    }}
                                >
                                  Add to Cart
                                </Button>
                            )}

                            {/* REMOVE */}
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => handleRemove(item._id)}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 1.2,
                                  fontSize: "0.8rem",
                                  py: 0.8
                                }}
                            >
                              Remove
                            </Button>

                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
              );
            })}
          </Stack>

          {/* Continue Shopping */}
          <Stack alignItems="center" mt={4}>
            <Button
                variant="outlined"
                component={Link}
                to="/"
                sx={{ textTransform: "none", borderRadius: 1.5, px: 4 }}
            >
              Continue Shopping
            </Button>
          </Stack>
        </Box>
      </Box>
  );
};
