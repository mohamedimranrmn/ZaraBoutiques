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
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Divider
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
import { ProductCard } from '../../products/components/ProductCard'
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
import { addToCartAsync, resetCartItemAddStatus, selectCartItemAddStatus, selectCartItems } from '../../cart/CartSlice'
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
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const handleAddRemoveFromWishlist = (e, productId) => {
    if (e.target.checked) {
      const data = { user: loggedInUser?._id, product: productId }
      dispatch(createWishlistItemAsync(data))
    } else if (!e.target.checked) {
      const index = wishlistItems.findIndex((item) => item.product._id === productId)
      if (index !== -1) {
        dispatch(deleteWishlistItemByIdAsync(wishlistItems[index]._id));
      }
    }
  }

  const handleRemoveFromWishlist = (wishlistItemId) => {
    dispatch(deleteWishlistItemByIdAsync(wishlistItemId))
  }

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant"
    })
  }, [])

  useEffect(() => {
    if (wishlistItemAddStatus === 'fulfilled') {
      toast.success("Product added to wishlist")
    } else if (wishlistItemAddStatus === 'rejected') {
      toast.error("Error adding product to wishlist, please try again later")
    }
  }, [wishlistItemAddStatus])

  useEffect(() => {
    if (wishlistItemDeleteStatus === 'fulfilled') {
      toast.success("Product removed from wishlist")
    } else if (wishlistItemDeleteStatus === 'rejected') {
      toast.error("Error removing product from wishlist, please try again later")
    }
  }, [wishlistItemDeleteStatus])

  useEffect(() => {
    if (wishlistItemUpdateStatus === 'fulfilled') {
      toast.success("Note updated")
    } else if (wishlistItemUpdateStatus === 'rejected') {
      toast.error("Error updating note")
    }
    setEditIndex(-1)
    setEditValue("")
  }, [wishlistItemUpdateStatus])

  useEffect(() => {
    if (cartItemAddStatus === 'fulfilled') {
      toast.success("Product added to cart")
    } else if (cartItemAddStatus === 'rejected') {
      toast.error('Error adding product to cart, please try again later')
    }
  }, [cartItemAddStatus])

  useEffect(() => {
    if (wishlistFetchStatus === 'rejected') {
      toast.error("Error fetching wishlist, please try again later")
    }
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

  const handleAddToCart = (productId) => {
    const data = { user: loggedInUser?._id, product: productId }
    dispatch(addToCartAsync(data))
  }

  // Loading state
  if (wishlistFetchStatus === 'pending') {
    return (
        <Stack
            justifyContent={'center'}
            alignItems={'center'}
            minHeight={'60vh'}
            mb={'5rem'}
        >
          <Lottie
              animationData={loadingAnimation}
              loop
              autoplay
              style={{ width: isMobile ? 180 : 260, height: isMobile ? 180 : 260 }}
          />
        </Stack>
    )
  }

  // Empty wishlist state
  if (wishlistItems?.length === 0) {
    return (
        <Stack
            justifyContent={'center'}
            alignItems={'center'}
            minHeight={'60vh'}
            mb={'5rem'}
        >
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
          >
            <Stack alignItems={'center'} rowGap={3} p={3}>
              <Lottie
                  animationData={emptyWishlistAnimation}
                  loop={true}
                  style={{ width: isMobile ? 200 : 300, height: isMobile ? 200 : 300 }}
              />

              <Typography variant='h5' fontWeight={500}>
                Your wishlist is empty
              </Typography>

              <Typography variant='body1' color={'text.secondary'} textAlign={'center'}>
                Save your favorite items here to purchase later
              </Typography>

              <Button
                  variant='contained'
                  component={Link}
                  to='/'
                  size='large'
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1.5,
                    px: 4,
                    boxShadow: 'none'
                  }}
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
        {/* Header */}
        <Box sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e5e7eb',
          py: { xs: 2.5, sm: 3.5 },
          px: { xs: 2, sm: 3, md: 4 },
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ maxWidth: '1200px', mx: 'auto' }}
          >
            <IconButton
                component={Link}
                to="/"
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1.5
                }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600} sx={{ letterSpacing: '-0.02em' }}>
                My Wishlist
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Wishlist Items */}
        <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mt: { xs: 3, sm: 4 } }}>
          <Stack spacing={2}>
            {wishlistItems?.map((item, index) => {
              const isInCart = cartItems.some((cartItem) => cartItem.product._id === item.product._id)

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
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            borderColor: '#d1d5db'
                          }
                        }}
                    >
                      <Grid container>
                        {/* Product Image & Info */}
                        <Grid item xs={12} sm={8} md={9}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ height: '100%' }}>
                            {/* Image */}
                            <Box
                                sx={{
                                  width: { xs: '100%', sm: 200 },
                                  height: { xs: 200, sm: 'auto' },
                                  flexShrink: 0
                                }}
                            >
                              <CardMedia
                                  component="img"
                                  image={item.product.thumbnail}
                                  alt={item.product.title}
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    bgcolor: '#f9fafb'
                                  }}
                              />
                            </Box>

                            {/* Product Details */}
                            <Stack sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }} spacing={2}>
                              <Box>
                                <Typography
                                    variant="caption"
                                    color="primary"
                                    sx={{
                                      textTransform: 'uppercase',
                                      fontWeight: 600,
                                      letterSpacing: '0.05em',
                                      fontSize: '0.7rem'
                                    }}
                                >
                                  {item.product.brand.name}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    fontWeight={600}
                                    sx={{
                                      mt: 0.5,
                                      mb: 1,
                                      fontSize: { xs: '1rem', sm: '1.25rem' }
                                    }}
                                >
                                  {item.product.title}
                                </Typography>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                  ₹{item.product.price}
                                </Typography>
                              </Box>

                              {/* Note Section */}
                              <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                  <Typography variant='body2' fontWeight={600}>
                                    Note
                                  </Typography>
                                  {editIndex !== index && (
                                      <IconButton
                                          size="small"
                                          onClick={() => handleEdit(index)}
                                          sx={{ ml: 'auto' }}
                                      >
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
                                          sx={{
                                            '& .MuiOutlinedInput-root': {
                                              borderRadius: 1.5
                                            }
                                          }}
                                      />
                                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            onClick={() => handleNoteUpdate(item._id)}
                                            size='small'
                                            variant='contained'
                                            sx={{
                                              textTransform: 'none',
                                              borderRadius: 1.5,
                                              boxShadow: 'none'
                                            }}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                            onClick={() => setEditIndex(-1)}
                                            size='small'
                                            variant='outlined'
                                            color='inherit'
                                            sx={{
                                              textTransform: 'none',
                                              borderRadius: 1.5
                                            }}
                                        >
                                          Cancel
                                        </Button>
                                      </Stack>
                                    </Stack>
                                ) : (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                          p: 1.5,
                                          bgcolor: '#f9fafb',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: 1.5
                                        }}
                                    >
                                      <Typography
                                          variant="body2"
                                          sx={{
                                            wordWrap: "break-word",
                                            color: item.note ? 'text.primary' : 'text.secondary',
                                            fontStyle: item.note ? 'normal' : 'italic'
                                          }}
                                      >
                                        {item.note ? item.note : "No note added"}
                                      </Typography>
                                    </Paper>
                                )}
                              </Box>
                            </Stack>
                          </Stack>
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={12} sm={4} md={3}>
                          <Stack
                              spacing={1.5}
                              sx={{
                                p: { xs: 2, sm: 2.5 },
                                height: '100%',
                                justifyContent: 'center',
                                borderLeft: { xs: 'none', sm: '1px solid #e5e7eb' },
                                borderTop: { xs: '1px solid #e5e7eb', sm: 'none' }
                              }}
                          >
                            {isInCart ? (
                                <Button
                                    fullWidth
                                    variant='outlined'
                                    color='success'
                                    component={Link}
                                    to={'/cart'}
                                    startIcon={<CheckCircleIcon />}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: 1.5,
                                      py: 1
                                    }}
                                >
                                  In Cart
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    variant='contained'
                                    onClick={() => handleAddToCart(item.product._id)}
                                    startIcon={<ShoppingCartOutlinedIcon />}
                                    disabled={item.product.stockQuantity === 0}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: 1.5,
                                      py: 1,
                                      boxShadow: 'none'
                                    }}
                                >
                                  {item.product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Button>
                            )}

                            <Button
                                fullWidth
                                variant='outlined'
                                color='error'
                                onClick={() => handleRemoveFromWishlist(item._id)}
                                startIcon={<DeleteOutlineIcon />}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: 1.5,
                                  py: 1
                                }}
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

          {/* Continue Shopping Button */}
          <Stack alignItems="center" mt={4}>
            <Button
                variant='outlined'
                component={Link}
                to='/'
                size='large'
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  px: 4,
                  fontWeight: 500
                }}
            >
              Continue Shopping
            </Button>
          </Stack>
        </Box>
      </Box>
  )
}