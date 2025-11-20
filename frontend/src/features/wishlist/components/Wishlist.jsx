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
  CardMedia
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useDispatch, useSelector } from 'react-redux'
import {
  createWishlistItemAsync,
  deleteWishlistItemByIdAsync,
  resetWishlistFetchStatus,
  resetWishlistItemAddStatus,
  resetWishlistItemDeleteStatus,
  resetWishlistItemUpdateStatus,
  selectWishlistFetchStatus,
  selectWishlistItemAddStatus,
  selectWishlistItemDeleteStatus,
  selectWishlistItemUpdateStatus,
  selectWishlistItems,
  updateWishlistItemByIdAsync
} from '../WishlistSlice'
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { emptyWishlistAnimation, loadingAnimation } from '../../../assets';
import Lottie from 'lottie-react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useForm } from "react-hook-form"
import {
  addToCartAsync,
  resetCartItemAddStatus,
  selectCartItemAddStatus,
  selectCartItems
} from '../../cart/CartSlice'
import { motion } from 'framer-motion';

export const Wishlist = () => {
  const dispatch = useDispatch()
  const wishlistItems = useSelector(selectWishlistItems)
  const wishlistItemAddStatus = useSelector(selectWishlistItemAddStatus)
  const wishlistItemDeleteStatus = useSelector(selectWishlistItemDeleteStatus)
  const wishlistItemUpdateStatus = useSelector(selectWishlistItemUpdateStatus)
  const loggedInUser = useSelector(selectLoggedInUser)
  const cartItems = useSelector(selectCartItems)
  const cartItemAddStatus = useSelector(selectCartItemAddStatus)
  const wishlistFetchStatus = useSelector(selectWishlistFetchStatus)

  const [editIndex, setEditIndex] = useState(-1)
  const [editValue, setEditValue] = useState('')
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleRemoveFromWishlist = (wishlistItemId) => {
    dispatch(deleteWishlistItemByIdAsync(wishlistItemId))
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  useEffect(() => {
    if (wishlistItemAddStatus === 'fulfilled') toast.success("Product added to wishlist")
    else if (wishlistItemAddStatus === 'rejected') toast.error("Error adding product to wishlist")
  }, [wishlistItemAddStatus])

  useEffect(() => {
    if (wishlistItemDeleteStatus === 'fulfilled') toast.success("Product removed from wishlist")
    else if (wishlistItemDeleteStatus === 'rejected') toast.error("Error removing product")
  }, [wishlistItemDeleteStatus])

  useEffect(() => {
    if (wishlistItemUpdateStatus === 'fulfilled') toast.success("Note updated")
    else if (wishlistItemUpdateStatus === 'rejected') toast.error("Error updating note")

    setEditIndex(-1)
    setEditValue("")
  }, [wishlistItemUpdateStatus])

  useEffect(() => {
    if (cartItemAddStatus === 'fulfilled') toast.success("Product added to cart")
    else if (cartItemAddStatus === 'rejected') toast.error("Error adding product to cart")
  }, [cartItemAddStatus])

  useEffect(() => {
    if (wishlistFetchStatus === 'rejected') toast.error("Error fetching wishlist")
  }, [wishlistFetchStatus])

  useEffect(() => {
    return () => {
      dispatch(resetWishlistFetchStatus())
      dispatch(resetCartItemAddStatus())
      dispatch(resetWishlistItemUpdateStatus())
      dispatch(resetWishlistItemDeleteStatus())
      dispatch(resetWishlistItemAddStatus())
    }
  }, [dispatch])

  const handleNoteUpdate = (wishlistItemId) => {
    const update = { _id: wishlistItemId, note: editValue }
    dispatch(updateWishlistItemByIdAsync(update))
  }

  const handleEdit = (index) => {
    setEditValue(wishlistItems[index]?.note || '')
    setEditIndex(index)
  }

  const handleAddToCart = (product) => {
    if (!product?._id) {
      toast.error("Product is no longer available")
      return
    }
    const data = { user: loggedInUser?._id, product: product._id }
    dispatch(addToCartAsync(data))
  }

  // Loading UI
  if (wishlistFetchStatus === 'pending') {
    return (
        <Stack justifyContent="center" alignItems="center" minHeight="60vh">
          <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 260 }} />
        </Stack>
    )
  }

  // Empty wishlist
  if (!wishlistItems?.length) {
    return (
        <Stack justifyContent="center" alignItems="center" minHeight="60vh">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Stack alignItems="center" rowGap={3} p={3}>
              <Lottie animationData={emptyWishlistAnimation} loop style={{ width: 300 }} />

              <Typography variant="h5" fontWeight={500}>
                Your wishlist is empty
              </Typography>

              <Typography variant="body1" color="text.secondary" textAlign="center">
                Save your favorite items here to purchase later
              </Typography>

              <Button
                  variant="contained"
                  component={Link}
                  to="/"
                  size="large"
                  sx={{ textTransform: 'none', borderRadius: 1.5, px: 4 }}
              >
                Start Shopping
              </Button>
            </Stack>
          </motion.div>
        </Stack>
    )
  }

  return (
      <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pb: 4 }}>
        {/* HEADER */}
        <Box sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e5e7eb',
          py: 3,
          px: 3,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ maxWidth: '1200px', mx: 'auto' }}>
            <IconButton component={Link} to="/" sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>My Wishlist</Typography>
          </Stack>
        </Box>

        {/* LIST */}
        <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3, mt: 3 }}>
          <Stack spacing={2}>
            {wishlistItems.map((item, index) => {
              const product = item.product || null

              const isDeleted = !product
              const isInCart = product
                  ? cartItems.some(ci => ci.product && ci.product._id === product._id)
                  : false

              return (
                  <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Paper
                        elevation={0}
                        sx={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                    >
                      <Grid container>

                        {/* LEFT SIDE: IMAGE + TITLE */}
                        <Grid item xs={12} sm={8} md={9}>
                          <Stack direction={{ xs: 'column', sm: 'row' }}>
                            {/* Image */}
                            <Box sx={{ width: { xs: '100%', sm: 200 }, height: { xs: 200, sm: 'auto' } }}>
                              <CardMedia
                                  component="img"
                                  image={product?.thumbnail || "/placeholder.png"}
                                  alt={product?.title || "Product removed"}
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>

                            {/* Product Info */}
                            <Stack sx={{ p: 2.5, flex: 1 }} spacing={2}>
                              <Box>
                                <Typography variant="caption" color="primary">
                                  {product?.brand?.name || "Unknown brand"}
                                </Typography>

                                <Typography variant="h6" fontWeight={600}>
                                  {product?.title || "Product Removed"}
                                </Typography>

                                {product?.price ? (
                                    <Typography variant="h6" fontWeight={700} color="primary">
                                      ₹{product.price}
                                    </Typography>
                                ) : (
                                    <Typography color="error.main" fontWeight={600}>
                                      No longer available
                                    </Typography>
                                )}
                              </Box>

                              {/* Note Section */}
                              <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                  <Typography variant="body2" fontWeight={600}>Note</Typography>
                                  {editIndex !== index && (
                                      <IconButton size="small" onClick={() => handleEdit(index)} sx={{ ml: 'auto' }}>
                                        <EditOutlinedIcon fontSize="small" />
                                      </IconButton>
                                  )}
                                </Stack>

                                {editIndex === index ? (
                                    <Stack spacing={1.5}>
                                      <TextField
                                          multiline
                                          rows={3}
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          placeholder="Add a note..."
                                          size="small"
                                      />

                                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            onClick={() => handleNoteUpdate(item._id)}
                                            size="small"
                                            variant="contained"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                            onClick={() => setEditIndex(-1)}
                                            size="small"
                                            variant="outlined"
                                        >
                                          Cancel
                                        </Button>
                                      </Stack>
                                    </Stack>
                                ) : (
                                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                      <Typography
                                          variant="body2"
                                          sx={{
                                            wordWrap: "break-word",
                                            color: item.note ? 'text.primary' : 'text.secondary',
                                            fontStyle: item.note ? 'normal' : 'italic'
                                          }}
                                      >
                                        {item.note || "No note added"}
                                      </Typography>
                                    </Paper>
                                )}
                              </Box>
                            </Stack>
                          </Stack>
                        </Grid>

                        {/* RIGHT SIDE ACTIONS */}
                        <Grid item xs={12} sm={4} md={3}>
                          <Stack spacing={1.5} sx={{
                            p: 2.5,
                            justifyContent: 'center',
                            height: '100%',
                            borderLeft: { sm: '1px solid #e5e7eb' },
                            borderTop: { xs: '1px solid #e5e7eb', sm: 'none' }
                          }}>
                            {/* ADD TO CART */}
                            {isDeleted ? (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    disabled
                                    sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  Not Available
                                </Button>
                            ) : isInCart ? (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="success"
                                    component={Link}
                                    to="/cart"
                                    startIcon={<CheckCircleIcon />}
                                    sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  In Cart
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => handleAddToCart(product)}
                                    startIcon={<ShoppingCartOutlinedIcon />}
                                    disabled={product?.stockQuantity === 0}
                                    sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  {product?.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                                </Button>
                            )}

                            {/* REMOVE */}
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                onClick={() => handleRemoveFromWishlist(item._id)}
                                startIcon={<DeleteOutlineIcon />}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Grid>

                      </Grid>
                    </Paper>
                  </motion.div>
              )
            })}
          </Stack>

          {/* Continue Shopping */}
          <Stack alignItems="center" mt={4}>
            <Button
                variant="outlined"
                component={Link}
                to="/"
                size="large"
                sx={{ textTransform: 'none', borderRadius: 1.5, px: 4 }}
            >
              Continue Shopping
            </Button>
          </Stack>
        </Box>
      </Box>
  )
}
