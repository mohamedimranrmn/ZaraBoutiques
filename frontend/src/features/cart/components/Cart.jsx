import React, { useEffect, useMemo, useState } from 'react'
import { CartItem } from './CartItem'
import {
    Button,
    Chip,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
    Box,
    Card,
    CardContent,
    Divider,
    alpha,
    Container,
    Grid,
    IconButton
} from '@mui/material'
import {
    resetCartItemRemoveStatus,
    selectCartItemRemoveStatus,
    selectCartItems,
    deleteCartItemByIdAsync
} from '../CartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import noOrders from '../../../assets/animations/noOrders.json'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { OutOfStockDialog } from '../../../dialogs/OutOfStockDialog'

export const Cart = ({ checkout = false, itemsOverride = null }) => {
    const reduxItems = useSelector(selectCartItems)
    const cartItemRemoveStatus = useSelector(selectCartItemRemoveStatus)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isTablet = useMediaQuery(theme.breakpoints.down('md'))

    const items = (checkout && Array.isArray(itemsOverride) && itemsOverride.length)
        ? itemsOverride
        : reduxItems

    /** SAFE subtotal calculation */
    const subtotalAll = items.reduce((acc, it) => {
        if (!it.product) return acc
        return acc + it.product.price * it.quantity
    }, 0)

    const [selectedMap, setSelectedMap] = useState({})
    const [oosDialogOpen, setOosDialogOpen] = useState(false)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [])

    useEffect(() => {
        return () => dispatch(resetCartItemRemoveStatus())
    }, [dispatch])

    useEffect(() => {
        if (checkout) return
        setSelectedMap(prev => {
            const next = {}
            reduxItems.forEach(it => {
                next[it._id] = prev[it._id] || false
            })
            return next
        })
    }, [reduxItems, checkout])

    const onToggleSelect = (id, checked) => {
        const item = reduxItems.find(it => it._id === id)

        if (!item?.product) return
        if (item.product.stockQuantity === 0) {
            setOosDialogOpen(true)
            return
        }

        setSelectedMap(prev => ({ ...prev, [id]: checked }))
    }

    /** SAFE selectedItems */
    const selectedItems = useMemo(() => {
        if (checkout) return []
        return reduxItems
            .filter(it => selectedMap[it._id] && it.product)
            .map(it => ({
                cartItemId: it._id,
                product: it.product,
                quantity: it.quantity,
                size: it.size || null
            }))
    }, [checkout, reduxItems, selectedMap])

    /** SAFE subtotal */
    const subtotalSelected = useMemo(() => {
        return selectedItems.reduce((acc, item) => {
            if (!item.product) return acc
            return acc + item.product.price * item.quantity
        }, 0)
    }, [selectedItems])

    const hasOOSSelected = selectedItems.some(
        (it) => it.product && it.product.stockQuantity === 0
    )

    if (items.length === 0) {
        return (
            <Box sx={{
                minHeight: { xs: '60vh', md: '70vh' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.grey[50], 0.3),
                py: { xs: 4, md: 6 }
            }}>
                <Stack alignItems="center" gap={{ xs: 2, md: 3 }} sx={{ px: 2, maxWidth: 400 }}>
                    <Lottie
                        animationData={noOrders}
                        loop
                        style={{ width: isMobile ? 160 : 200 }}
                    />
                    <Stack alignItems="center" gap={1}>
                        <Typography
                            variant={isMobile ? 'h6' : 'h5'}
                            fontWeight={700}
                            textAlign="center"
                        >
                            Your cart is empty
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                        >
                            Add items to get started
                        </Typography>
                    </Stack>
                    <Button
                        variant='contained'
                        component={Link}
                        to='/'
                        endIcon={<ArrowForwardIcon />}
                        size={isMobile ? 'medium' : 'large'}
                        sx={{
                            px: { xs: 3, md: 4 },
                            py: { xs: 1, md: 1.25 },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            fontWeight: 600
                        }}
                    >
                        Start Shopping
                    </Button>
                </Stack>
            </Box>
        )
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: checkout ? 'transparent' : alpha(theme.palette.grey[50], 0.3)
        }}>

            {!checkout && !isMobile && (
                <Box
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'white',
                        py: 2.5
                    }}
                >
                    <Container maxWidth="xl">
                        <Stack direction="row" alignItems="center" gap={2}>
                            <IconButton
                                component={Link}
                                to="/"
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
                                    Shopping Cart
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {items.length} item{items.length !== 1 ? 's' : ''} in your cart
                                </Typography>
                            </Box>
                        </Stack>
                    </Container>
                </Box>
            )}

            <Container maxWidth="xl" sx={{
                px: { xs: 2, sm: 3, md: 4 },
                py: checkout ? 0 : { xs: 2, sm: 3, md: 4 }
            }}>
                {!checkout && isMobile && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={{ xs: 1.5, md: 2 }}
                        sx={{ mb: { xs: 2, md: 3 } }}
                    >
                        <IconButton
                            component={Link}
                            to="/"
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
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ fontSize: '1.25rem' }}
                        >
                            Cart Summary
                        </Typography>
                    </Stack>
                )}

                <Grid container spacing={{ xs: 2, md: 3 }}>
                    <Grid item xs={12} md={checkout ? 12 : 8}>
                        <Stack gap={{ xs: 1.5, md: 2 }}>

                            {items.map((item) => {
                                if (!item.product) {
                                    return (
                                        <Box
                                            key={item._id}
                                            sx={{
                                                border: "1px solid",
                                                borderColor: "error.main",
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: "#fff6f6",
                                                mb: 2
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <Typography fontWeight={600} color="error.main">
                                                    This product is no longer available.
                                                </Typography>

                                                <Button
                                                    color="error"
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => dispatch(deleteCartItemByIdAsync(item._id))}
                                                >
                                                    Remove
                                                </Button>
                                            </Stack>
                                        </Box>
                                    );
                                }

                                return (
                                    <CartItem
                                        key={item._id}
                                        _id={item._id}
                                        product={item.product}
                                        quantity={item.quantity}
                                        size={item.size}
                                        selectable={!checkout}
                                        checked={!checkout ? !!selectedMap[item._id] : false}
                                        onSelectChange={(checked) =>
                                            !checkout && onToggleSelect(item._id, checked)
                                        }
                                        greyOut={!item.product || item.product.stockQuantity === 0}
                                    />
                                );
                            })}

                        </Stack>
                    </Grid>

                    {!checkout && (
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: { xs: 'relative', md: 'sticky' },
                                top: { md: 24 }
                            }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: { xs: 2, md: 2.5 }
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                        <Stack gap={{ xs: 2, md: 2.5 }}>

                                            <Stack gap={0.5}>
                                                <Typography
                                                    variant={isMobile ? "body1" : "h6"}
                                                    fontWeight={700}
                                                >
                                                    Order Summary
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                                                </Typography>
                                            </Stack>

                                            <Divider />

                                            <Stack gap={1.5}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Typography variant="body2" color="text.secondary">
                                                        Subtotal
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        ₹{subtotalSelected.toFixed(2)}
                                                    </Typography>
                                                </Stack>

                                                <Divider />

                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Typography variant="body1" fontWeight={700}>
                                                        Total
                                                    </Typography>
                                                    <Typography
                                                        variant={isMobile ? "h6" : "h5"}
                                                        fontWeight={700}
                                                        color="primary.main"
                                                    >
                                                        ₹{subtotalSelected.toFixed(2)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            <Button
                                                fullWidth
                                                variant='contained'
                                                disabled={selectedItems.length === 0}
                                                onClick={() => {
                                                    if (hasOOSSelected) {
                                                        setOosDialogOpen(true)
                                                        return
                                                    }
                                                    navigate('/checkout', { state: { selectedItems } })
                                                }}
                                                endIcon={<ArrowForwardIcon fontSize="small" />}
                                                size={isMobile ? 'medium' : 'large'}
                                                sx={{
                                                    py: { xs: 1.25, md: 1.5 },
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontSize: { xs: '0.9rem', md: '1rem' },
                                                    fontWeight: 600
                                                }}
                                            >
                                                Proceed to Checkout ({selectedItems.length})
                                            </Button>

                                            <Stack alignItems="center">
                                                <Chip
                                                    component={Link}
                                                    to='/'
                                                    label="Continue Shopping"
                                                    variant='outlined'
                                                    size={isMobile ? "small" : "medium"}
                                                    clickable
                                                    sx={{
                                                        borderRadius: 1.5,
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Container>

            <OutOfStockDialog
                open={oosDialogOpen}
                onClose={() => setOosDialogOpen(false)}
                message="One or more selected items are out of stock. Please unselect or remove them to continue."
            />
        </Box>
    )
}
