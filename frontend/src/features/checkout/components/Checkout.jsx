// frontend/src/features/checkout/Checkout.jsx
import {
    Stack,
    TextField,
    Typography,
    Button,
    Grid,
    Paper,
    IconButton,
    Divider,
    Box,
    Chip,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    alpha,
    Container
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import React, {
    useEffect,
    useMemo,
    useState,
    useCallback
} from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { addAddressAsync, selectAddressStatus, selectAddresses } from '../../address/AddressSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
    resetCartByUserIdAsync,
    selectCartItems,
    deleteCartItemByIdAsync
} from '../../cart/CartSlice'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HomeIcon from '@mui/icons-material/Home'
import WorkIcon from '@mui/icons-material/Work'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import LockIcon from '@mui/icons-material/Lock'
import { SHIPPING, TAXES } from '../../../constants'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { axiosi } from '../../../config/axios'
import PaymentSuccessDialog from '../../../dialogs/PaymentSuccessDialog';

// Load Razorpay script once (same as before)
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

export const Checkout = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const addresses = useSelector(selectAddresses)
    const loggedInUser = useSelector(selectLoggedInUser)
    const addressStatus = useSelector(selectAddressStatus)
    const cartItems = useSelector(selectCartItems)

    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [isOnlinePaying, setIsOnlinePaying] = useState(false)

    const [showSuccessAnimation, setShowSuccessAnimation] = useState({
        open: false,
        orderId: null
    });

    // Data from cart or Buy-Now
    const passedSelectedItems = location.state?.selectedItems || null
    const buyNowItem = location.state?.buyNow ? location.state?.product : null

    // If buyNowItem exists, it should already have price set (ProductDetails pushes discounted price)
    const formattedBuyNowItem = buyNowItem
        ? [{
            cartItemId: null,
            product: {
                _id: buyNowItem._id,
                title: buyNowItem.title,
                price: buyNowItem.price, // should be discounted price
                thumbnail: buyNowItem.thumbnail,
                brand: { name: buyNowItem.brand }
            },
            quantity: buyNowItem.quantity,
            size: buyNowItem.size || null,
            price: buyNowItem.price // store price at top-level for easier usage
        }]
        : null

    // Items to checkout: include price (cart item price if present)
    const itemsToCheckout = useMemo(() => {
        if (formattedBuyNowItem) return formattedBuyNowItem;
        if (passedSelectedItems?.length) return passedSelectedItems;
        return cartItems.map(ci => ({
            cartItemId: ci._id,
            product: ci.product,
            quantity: ci.quantity,
            size: ci.size || null,
            price: (typeof ci.price === 'number' ? ci.price : (ci.product?.price ?? 0))
        }));
    }, [passedSelectedItems, cartItems, formattedBuyNowItem]);

    const hasInvalidItems = useMemo(() =>
            itemsToCheckout.some(it => !it.product || !it.product._id || typeof (it.price ?? it.product.price) !== 'number'),
        [itemsToCheckout]
    );

    // Totals: use item.price (cart-stored price or buy-now price) first
    const orderSubtotal = useMemo(() => itemsToCheckout.reduce((acc, item) => {
        if (!item.product || typeof (item.price ?? item.product.price) !== 'number') return acc;
        const unitPrice = (typeof item.price === 'number' && !Number.isNaN(item.price)) ? item.price : item.product.price;
        return acc + (unitPrice * item.quantity);
    }, 0), [itemsToCheckout]);

    const orderTotal = orderSubtotal + SHIPPING + TAXES;

    // ... rest of the component mostly unchanged, but update any local lineTotals/display to use item.price if present

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            setSelectedAddressId(addresses[0]._id)
            setShowAddressForm(false)
        }
    }, [addresses, selectedAddressId])

    useEffect(() => {
        if (addressStatus === 'fulfilled') {
            reset()
            setShowAddressForm(false)
            toast.success('Address added successfully')
        }
    }, [addressStatus, reset])

    const selectedAddress = useMemo(
        () => addresses.find(a => a._id === selectedAddressId) || null,
        [addresses, selectedAddressId]
    )

    useEffect(() => {
        if (!itemsToCheckout?.length) {
            toast.info('Your cart is empty.')
            navigate('/cart')
        }
    }, [itemsToCheckout, navigate])

    const finalizeCartAfterOrder = useCallback(
        async (orderId) => {
            try {
                const onlySelected = passedSelectedItems || null;

                if (onlySelected) {
                    await Promise.all(
                        onlySelected
                            .filter(ci => ci.cartItemId)
                            .map(ci =>
                                dispatch(deleteCartItemByIdAsync(ci.cartItemId)).unwrap()
                            )
                    );
                } else if (!formattedBuyNowItem && loggedInUser?._id) {
                    await dispatch(resetCartByUserIdAsync(loggedInUser._id)).unwrap();
                }

            } catch (err) {
                // nothing to do here
            }
        },
        [dispatch, passedSelectedItems, formattedBuyNowItem, loggedInUser]
    );

    const handleAddAddress = (data) => {
        if (!loggedInUser?._id) {
            toast.error('Please login.')
            return
        }
        dispatch(addAddressAsync({ ...data, user: loggedInUser._id }))
    }

    // Payment flow: build payload using frontend-calculated subtotal (which uses item.price)
    const handleRazorpayPayment = async () => {
        try {
            if (!loggedInUser?._id) {
                toast.error('Please login to place order.')
                return
            }
            if (!selectedAddress) {
                toast.error('Please select an address.')
                return
            }
            if (!itemsToCheckout?.length) {
                toast.error('Your cart is empty.')
                return
            }
            if (hasInvalidItems) {
                toast.error('Some items are no longer available. Please update your cart.')
                return
            }

            const scriptLoaded = await loadRazorpayScript()
            if (!scriptLoaded || !window.Razorpay) {
                toast.error('Unable to load Razorpay. Please try again.')
                setIsOnlinePaying(false)
                return
            }

            setIsOnlinePaying(true)

            // Build order items payload: product id + qty + size + unit price (so backend can verify)
            const orderItemsPayload = itemsToCheckout.map(it => ({
                product: { _id: it.product._id },
                quantity: it.quantity,
                size: it.size || null,
                unitPrice: (typeof it.price === 'number' ? it.price : it.product.price)
            }))

            const payload = {
                user: loggedInUser._id,
                userEmail: loggedInUser.email,
                userName: loggedInUser.name,
                item: orderItemsPayload,
                address: selectedAddress,
                subtotal: orderSubtotal,
                shippingCharge: SHIPPING,
                taxAmount: TAXES,
                finalAmount: orderTotal,
                paymentMode: 'RAZORPAY'
            }

            const { data } = await axiosi.post('/orders/razorpay/create', payload)

            if (!data || !data.razorpayOrderId || !data.keyId) {
                toast.error('Failed to initiate payment. Please try again.')
                setIsOnlinePaying(false)
                return
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency || 'INR',
                name: 'Zee Boutiques',
                description: 'Order Payment',
                order_id: data.razorpayOrderId,
                prefill: {
                    name: loggedInUser.name || '',
                    email: loggedInUser.email || '',
                    contact: selectedAddress.phoneNumber || ''
                },
                theme: {
                    color: '#111827'
                },
                handler: async function (response) {
                    try {
                        await axiosi.post('/orders/razorpay/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: data.orderId
                        });

                        setIsOnlinePaying(false);
                        setShowSuccessAnimation({
                            open: true,
                            orderId: data.orderId
                        });

                    } catch (err) {
                        console.error(err);
                        toast.error('Payment verification failed. If amount is debited, please contact support.');
                        setIsOnlinePaying(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.info('Payment popup closed.')
                        setIsOnlinePaying(false)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err) {
            console.error(err)
            toast.error('Something went wrong while initiating payment.')
            setIsOnlinePaying(false)
        }
    }

    const normalizePhone = (phone) =>
        (phone || '').toString().replace(/\D/g, '').slice(-10)

    const handleViewOrder = (orderId) => {
        if (!orderId) {
            toast.error("Order ID missing");
            return;
        }

        navigate(`/order-success/${orderId}`);

        setTimeout(() => {
            finalizeCartAfterOrder(orderId);
            setShowSuccessAnimation({ open: false, orderId: null });
        }, 50);
    };

    const handlePayClick = () => {
        if (!selectedAddress) {
            toast.error('Please select an address.')
            return
        }

        if (!itemsToCheckout?.length) {
            toast.error('Your cart is empty.')
            return
        }

        if (hasInvalidItems) {
            toast.error('Some items are no longer available. Please update your cart.')
            return
        }

        const rawPhone = selectedAddress.phoneNumber
        const normalized = normalizePhone(rawPhone)

        if (!normalized || normalized.length !== 10) {
            toast.error('Selected address has an invalid phone number.')
            return
        }

        handleRazorpayPayment()
    }

    const getAddressIcon = (type) => {
        const lowerType = type?.toLowerCase() || ''
        if (lowerType.includes('home')) return <HomeIcon fontSize="small" />
        if (lowerType.includes('work') || lowerType.includes('office')) return <WorkIcon fontSize="small" />
        return <LocationOnIcon fontSize="small" />
    }

    const handleResetForm = () => {
        reset()
        setShowAddressForm(false)
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: isMobile ? alpha(theme.palette.grey[50], 0.5) : 'white'
            }}
        >
            {/* Desktop: Top Bar with Back Button and Title */}
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
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" gap={2}>
                                <IconButton
                                    component={Link}
                                    to="/cart"
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
                                        Secure Checkout
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Review your order and complete payment
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Container>
                </Box>
            )}

            {/* Mobile: Header */}
            {isMobile && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Stack direction="row" alignItems="center" gap={1.25}>
                            <IconButton
                                component={Link}
                                to="/cart"
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
                            <Box>
                                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.3px' }}>
                                    Checkout
                                </Typography>
                            </Box>
                        </Stack>
                    </motion.div>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                {isMobile ? (
                    /* Mobile Layout */
                    <Grid container spacing={2.5}>
                        {/* Address */}
                        <Grid item xs={12}>
                            <Stack gap={2}>
                                <motion.div
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.25, delay: 0.05 }}
                                >
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2
                                        }}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Stack gap={2}>
                                                <Stack direction="row" alignItems="center" gap={1.25}>
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <LocalShippingIcon fontSize="small" color="primary" />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={600}>
                                                            Delivery Address
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {addresses.length} saved address
                                                            {addresses.length !== 1 ? 'es' : ''}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {addresses.length > 0 && (
                                                    <Stack spacing={1.5}>
                                                        {addresses.map(address => (
                                                            <Paper
                                                                key={address._id}
                                                                elevation={0}
                                                                onClick={() => setSelectedAddressId(address._id)}
                                                                sx={{
                                                                    p: 1.5,
                                                                    cursor: 'pointer',
                                                                    border: '1.5px solid',
                                                                    borderColor: selectedAddressId === address._id
                                                                        ? 'primary.main'
                                                                        : 'divider',
                                                                    bgcolor: selectedAddressId === address._id
                                                                        ? alpha(theme.palette.primary.main, 0.03)
                                                                        : 'white',
                                                                    borderRadius: 1.5,
                                                                    transition: 'all 0.2s',
                                                                    '&:hover': {
                                                                        borderColor: 'primary.main',
                                                                        boxShadow: 1
                                                                    }
                                                                }}
                                                            >
                                                                <Stack gap={1}>
                                                                    <Stack
                                                                        direction="row"
                                                                        alignItems="center"
                                                                        justifyContent="space-between"
                                                                    >
                                                                        <Chip
                                                                            icon={getAddressIcon(address.type)}
                                                                            label={address.type}
                                                                            size="small"
                                                                            color={selectedAddressId === address._id ? 'primary' : 'default'}
                                                                            sx={{ fontWeight: 500, height: 22 }}
                                                                        />
                                                                        <Box
                                                                            sx={{
                                                                                width: 14,
                                                                                height: 14,
                                                                                borderRadius: '50%',
                                                                                border: '2px solid',
                                                                                borderColor: selectedAddressId === address._id
                                                                                    ? 'primary.main'
                                                                                    : 'divider',
                                                                                bgcolor: selectedAddressId === address._id
                                                                                    ? 'primary.main'
                                                                                    : 'transparent'
                                                                            }}
                                                                        />
                                                                    </Stack>

                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={500}>
                                                                            {address.street}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {address.city}, {address.state}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {address.country} - {address.postalCode}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{ mt: 0.5, display: 'block' }}
                                                                        >
                                                                            📞 {address.phoneNumber}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                )}

                                                {!showAddressForm && (
                                                    <Button
                                                        variant="text"
                                                        color="primary"
                                                        onClick={() => setShowAddressForm(true)}
                                                        sx={{
                                                            alignSelf: 'center',
                                                            textTransform: 'none',
                                                            fontSize: '0.8rem',
                                                            px: 1,
                                                            minHeight: 0
                                                        }}
                                                    >
                                                        + Add New Address
                                                    </Button>
                                                )}

                                                {showAddressForm && (
                                                    <Box
                                                        component="form"
                                                        onSubmit={handleSubmit(handleAddAddress)}
                                                        sx={{
                                                            p: 2,
                                                            bgcolor: alpha(theme.palette.grey[100], 0.7),
                                                            borderRadius: 1.5,
                                                            border: '1px dashed',
                                                            borderColor: 'divider'
                                                        }}
                                                    >
                                                        <Stack gap={1.5}>
                                                            <Grid container spacing={1.5}>
                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Address Type"
                                                                        placeholder="Home, Office..."
                                                                        error={!!errors.type}
                                                                        helperText={errors.type && 'Required'}
                                                                        {...register('type', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Phone Number"
                                                                        error={!!errors.phoneNumber}
                                                                        helperText={errors.phoneNumber && 'Required'}
                                                                        {...register('phoneNumber', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Street Address"
                                                                        error={!!errors.street}
                                                                        helperText={errors.street && 'Required'}
                                                                        {...register('street', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="City"
                                                                        error={!!errors.city}
                                                                        helperText={errors.city && 'Required'}
                                                                        {...register('city', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="State"
                                                                        error={!!errors.state}
                                                                        helperText={errors.state && 'Required'}
                                                                        {...register('state', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Postal Code"
                                                                        error={!!errors.postalCode}
                                                                        helperText={errors.postalCode && 'Required'}
                                                                        {...register('postalCode', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Country"
                                                                        error={!!errors.country}
                                                                        helperText={errors.country && 'Required'}
                                                                        {...register('country', { required: true })}
                                                                    />
                                                                </Grid>
                                                            </Grid>

                                                            <Stack direction="row" gap={1} justifyContent="flex-end">
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={handleResetForm}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        px: 3,
                                                                        py: 0.75,
                                                                        borderRadius: 1.5,
                                                                        fontSize: '0.85rem'
                                                                    }}
                                                                >
                                                                    Reset
                                                                </Button>
                                                                <LoadingButton
                                                                    type="submit"
                                                                    variant="contained"
                                                                    loading={addressStatus === 'pending'}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        px: 3,
                                                                        py: 0.75,
                                                                        borderRadius: 1.5,
                                                                        fontSize: '0.85rem'
                                                                    }}
                                                                >
                                                                    Save
                                                                </LoadingButton>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Stack>
                        </Grid>

                        {/* Summary + Pay */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25, delay: 0.05 }}
                            >
                                <Card
                                    elevation={0}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2
                                    }}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Stack gap={2}>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Order Summary
                                            </Typography>

                                            {/* Items */}
                                            <Stack
                                                gap={1.5}
                                                sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5 }}
                                            >
                                                {itemsToCheckout.map((item, idx) => {
                                                    const product = item.product || null
                                                    const isDeleted = !product || !product._id
                                                    const unitPrice = (typeof item.price === 'number' && !Number.isNaN(item.price))
                                                        ? item.price
                                                        : product?.price || 0;

                                                    const lineTotal = unitPrice * item.quantity;


                                                    return (
                                                        <Stack
                                                            key={idx}
                                                            direction="row"
                                                            gap={1.5}
                                                            sx={{
                                                                p: 1,
                                                                bgcolor: alpha(theme.palette.grey[100], 0.7),
                                                                borderRadius: 1.5
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: 56,
                                                                    height: 56,
                                                                    flexShrink: 0,
                                                                    borderRadius: 1.5,
                                                                    overflow: 'hidden',
                                                                    bgcolor: 'white',
                                                                    border: '1px solid',
                                                                    borderColor: 'divider'
                                                                }}
                                                            >
                                                                <img
                                                                    src={product?.thumbnail || "/placeholder.png"}
                                                                    alt={product?.title || "Product removed"}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'contain'
                                                                    }}
                                                                />
                                                            </Box>

                                                            <Stack flex={1} justifyContent="space-between">
                                                                <Box>
                                                                    <Typography
                                                                        variant="body2"
                                                                        fontWeight={500}
                                                                        sx={{
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical'
                                                                        }}
                                                                    >
                                                                        {product?.title || "Product no longer available"}
                                                                    </Typography>
                                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Qty: {item.quantity}
                                                                        </Typography>
                                                                        {item.size && !isDeleted && (
                                                                            <>
                                                                                <Typography variant="caption" color="text.secondary">•</Typography>
                                                                                <Chip
                                                                                    label={`Size: ${item.size}`}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: 16,
                                                                                        fontSize: '0.65rem',
                                                                                        fontWeight: 600,
                                                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                                        color: 'primary.main'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                    </Stack>
                                                                    {isDeleted && (
                                                                        <Typography variant="caption" color="error.main">
                                                                            This item is no longer available
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={600}
                                                                    color="primary"
                                                                >
                                                                    ₹{lineTotal.toFixed(2)}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    )
                                                })}
                                            </Stack>

                                            <Divider />

                                            {/* Price Breakdown */}
                                            <Stack gap={0.75} fontSize="0.9rem">
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Subtotal
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        ₹{orderSubtotal.toFixed(2)}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Shipping
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        ₹{SHIPPING.toFixed(2)}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Taxes
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        ₹{TAXES.toFixed(2)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            <Divider />

                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                sx={{
                                                    p: 1.25,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.07),
                                                    borderRadius: 1.5
                                                }}
                                            >
                                                <Typography variant="body1" fontWeight={600}>
                                                    Total
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={700}
                                                    color="primary.main"
                                                    sx={{ fontSize: '1.1rem' }}
                                                >
                                                    ₹{orderTotal.toFixed(2)}
                                                </Typography>
                                            </Stack>

                                            <LoadingButton
                                                fullWidth
                                                variant="contained"
                                                loading={isOnlinePaying}
                                                onClick={handlePayClick}
                                                disabled={!selectedAddress || !itemsToCheckout.length || hasInvalidItems}
                                                sx={{
                                                    mt: 0.5,
                                                    py: 1,
                                                    textTransform: 'none',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    borderRadius: 1.5,
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        boxShadow: 'none',
                                                        transform: 'translateY(-1px)'
                                                    },
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {isOnlinePaying ? 'Processing payment...' : 'Pay Securely'}
                                            </LoadingButton>

                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="center"
                                                gap={0.5}
                                                sx={{
                                                    p: 1,
                                                    bgcolor: alpha(theme.palette.success.main, 0.08),
                                                    borderRadius: 1.5
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    color="success.main"
                                                    fontWeight={600}
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                >
                                                    Powered by
                                                    <img
                                                        src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                                                        alt="Razorpay"
                                                        style={{ height: 16 }}
                                                    />
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    </Grid>
                ) : (
                    /* Desktop Layout */
                    <Grid container spacing={3}>
                        {/* LEFT: Address */}
                        <Grid item xs={12} md={7}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Stack gap={3}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 3
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Stack gap={3}>
                                                <Stack direction="row" alignItems="center" gap={2}>
                                                    <Box
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 2,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <LocalShippingIcon color="primary" />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h6" fontWeight={700}>
                                                            Delivery Address
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Choose where to deliver your order
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {addresses.length > 0 && (
                                                    <Stack gap={2}>
                                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                            Saved Addresses ({addresses.length})
                                                        </Typography>
                                                        <Grid container spacing={2}>
                                                            {addresses.map(address => (
                                                                <Grid item xs={12} lg={6} key={address._1d || address._id}>
                                                                    <Paper
                                                                        elevation={0}
                                                                        onClick={() => setSelectedAddressId(address._id)}
                                                                        sx={{
                                                                            p: 2,
                                                                            cursor: 'pointer',
                                                                            border: '2px solid',
                                                                            borderColor: selectedAddressId === address._id
                                                                                ? 'primary.main'
                                                                                : 'divider',
                                                                            bgcolor: selectedAddressId === address._id
                                                                                ? alpha(theme.palette.primary.main, 0.04)
                                                                                : 'white',
                                                                            borderRadius: 2,
                                                                            transition: 'all 0.2s',
                                                                            position: 'relative',
                                                                            '&:hover': {
                                                                                borderColor: 'primary.main',
                                                                                boxShadow: 2,
                                                                                transform: 'translateY(-2px)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Stack gap={1.5}>
                                                                            <Stack
                                                                                direction="row"
                                                                                alignItems="center"
                                                                                justifyContent="space-between"
                                                                            >
                                                                                <Chip
                                                                                    icon={getAddressIcon(address.type)}
                                                                                    label={address.type}
                                                                                    size="small"
                                                                                    color={selectedAddressId === address._id ? 'primary' : 'default'}
                                                                                    sx={{ fontWeight: 600 }}
                                                                                />
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 20,
                                                                                        height: 20,
                                                                                        borderRadius: '50%',
                                                                                        border: '2px solid',
                                                                                        borderColor: selectedAddressId === address._id
                                                                                            ? 'primary.main'
                                                                                            : 'divider',
                                                                                        bgcolor: selectedAddressId === address._id
                                                                                            ? 'primary.main'
                                                                                            : 'transparent',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center'
                                                                                    }}
                                                                                >
                                                                                    {selectedAddressId === address._id && (
                                                                                        <Box
                                                                                            sx={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: '50%',
                                                                                                bgcolor: 'white'
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                </Box>
                                                                            </Stack>

                                                                            <Box>
                                                                                <Typography variant="body1" fontWeight={600}>
                                                                                    {address.street}
                                                                                </Typography>
                                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                                    {address.city}, {address.state}
                                                                                </Typography>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {address.country} - {address.postalCode}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    color="text.secondary"
                                                                                    sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                                                >
                                                                                    📞 {address.phoneNumber}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Stack>
                                                                    </Paper>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </Stack>
                                                )}

                                                {!showAddressForm && (
                                                    <Button
                                                        variant="text"
                                                        color="primary"
                                                        onClick={() => setShowAddressForm(true)}
                                                        startIcon={<LocationOnIcon />}
                                                        sx={{
                                                            alignSelf: 'flex-start',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 2,
                                                            py: 1
                                                        }}
                                                    >
                                                        Add New Address
                                                    </Button>
                                                )}

                                                {showAddressForm && (
                                                    <Box
                                                        component="form"
                                                        onSubmit={handleSubmit(handleAddAddress)}
                                                        sx={{
                                                            p: 3,
                                                            bgcolor: alpha(theme.palette.grey[50], 0.5),
                                                            borderRadius: 2,
                                                            border: '2px dashed',
                                                            borderColor: 'divider'
                                                        }}
                                                    >
                                                        <Stack gap={2}>
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                New Address Details
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Address Type"
                                                                        placeholder="Home, Office, etc."
                                                                        error={!!errors.type}
                                                                        helperText={errors.type && 'Required field'}
                                                                        {...register('type', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Phone Number"
                                                                        placeholder="+91 XXXXX XXXXX"
                                                                        error={!!errors.phoneNumber}
                                                                        helperText={errors.phoneNumber && 'Required field'}
                                                                        {...register('phoneNumber', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Street Address"
                                                                        placeholder="House no, Building name, Street"
                                                                        error={!!errors.street}
                                                                        helperText={errors.street && 'Required field'}
                                                                        {...register('street', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="City"
                                                                        error={!!errors.city}
                                                                        helperText={errors.city && 'Required field'}
                                                                        {...register('city', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="State"
                                                                        error={!!errors.state}
                                                                        helperText={errors.state && 'Required field'}
                                                                        {...register('state', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Postal Code"
                                                                        error={!!errors.postalCode}
                                                                        helperText={errors.postalCode && 'Required field'}
                                                                        {...register('postalCode', { required: true })}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Country"
                                                                        error={!!errors.country}
                                                                        helperText={errors.country && 'Required field'}
                                                                        {...register('country', { required: true })}
                                                                    />
                                                                </Grid>
                                                            </Grid>

                                                            <Stack direction="row" gap={2} justifyContent="flex-end">
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={handleResetForm}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        px: 4,
                                                                        py: 1.25
                                                                    }}
                                                                >
                                                                    Reset
                                                                </Button>
                                                                <LoadingButton
                                                                    type="submit"
                                                                    variant="contained"
                                                                    loading={addressStatus === 'pending'}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        px: 4,
                                                                        py: 1.25
                                                                    }}
                                                                >
                                                                    Save Address
                                                                </LoadingButton>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Stack>
                            </motion.div>
                        </Grid>

                        {/* RIGHT: Summary */}
                        <Grid item xs={12} md={5}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                            >
                                <Box sx={{ position: 'sticky', top: 24 }}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 3,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 3,
                                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                                borderBottom: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" gap={2}>
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 2,
                                                        bgcolor: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '1px solid',
                                                        borderColor: 'divider'
                                                    }}
                                                >
                                                    <ShoppingBagIcon color="primary" />
                                                </Box>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700}>
                                                        Order Summary
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {itemsToCheckout.length} item{itemsToCheckout.length !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>

                                        <CardContent sx={{ p: 3 }}>
                                            <Stack gap={3}>
                                                <Stack
                                                    gap={2}
                                                    sx={{
                                                        maxHeight: 320,
                                                        overflowY: 'auto',
                                                        pr: 1,
                                                        '&::-webkit-scrollbar': {
                                                            width: '6px'
                                                        },
                                                        '&::-webkit-scrollbar-track': {
                                                            bgcolor: alpha(theme.palette.grey[200], 0.3),
                                                            borderRadius: 10
                                                        },
                                                        '&::-webkit-scrollbar-thumb': {
                                                            bgcolor: alpha(theme.palette.grey[400], 0.5),
                                                            borderRadius: 10,
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.grey[500], 0.7)
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {itemsToCheckout.map((item, idx) => {
                                                        const product = item.product || null
                                                        const isDeleted = !product || !product._id
                                                        const unitPrice = (typeof item.price === 'number' && !Number.isNaN(item.price))
                                                            ? item.price
                                                            : product?.price || 0;

                                                        const lineTotal = unitPrice * item.quantity;


                                                        return (
                                                            <Stack
                                                                key={idx}
                                                                direction="row"
                                                                gap={2}
                                                                sx={{
                                                                    p: 1.5,
                                                                    bgcolor: alpha(theme.palette.grey[50], 0.5),
                                                                    borderRadius: 2,
                                                                    border: '1px solid',
                                                                    borderColor: 'divider'
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 70,
                                                                        height: 70,
                                                                        flexShrink: 0,
                                                                        borderRadius: 1.5,
                                                                        overflow: 'hidden',
                                                                        bgcolor: 'white',
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        p: 1
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={product?.thumbnail || "/placeholder.png"}
                                                                        alt={product?.title || "Product removed"}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'contain'
                                                                        }}
                                                                    />
                                                                </Box>

                                                                <Stack flex={1} justifyContent="space-between">
                                                                    <Box>
                                                                        <Typography
                                                                            variant="body1"
                                                                            fontWeight={600}
                                                                            sx={{
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                display: '-webkit-box',
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient: 'vertical',
                                                                                lineHeight: 1.4
                                                                            }}
                                                                        >
                                                                            {product?.title || "Product no longer available"}
                                                                        </Typography>
                                                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                            >
                                                                                Quantity: {item.quantity}
                                                                            </Typography>
                                                                            {item.size && !isDeleted && (
                                                                                <>
                                                                                    <Typography variant="body2" color="text.secondary">•</Typography>
                                                                                    <Chip
                                                                                        label={`Size: ${item.size}`}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            height: 20,
                                                                                            fontSize: '0.7rem',
                                                                                            fontWeight: 600,
                                                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                                            color: 'primary.main'
                                                                                        }}
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </Stack>
                                                                        {isDeleted && (
                                                                            <Typography variant="caption" color="error.main">
                                                                                This item is no longer available
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                    <Typography
                                                                        variant="h6"
                                                                        fontWeight={700}
                                                                        color="primary.main"
                                                                        sx={{ fontSize: '1.1rem' }}
                                                                    >
                                                                        ₹{lineTotal.toFixed(2)}
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        )
                                                    })}
                                                </Stack>

                                                <Divider />

                                                <Stack gap={1.5}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body1" color="text.secondary">
                                                            Subtotal
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={600}>
                                                            ₹{orderSubtotal.toFixed(2)}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body1" color="text.secondary">
                                                            Shipping Charges
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={600}>
                                                            ₹{SHIPPING.toFixed(2)}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body1" color="text.secondary">
                                                            Taxes & Fees
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={600}>
                                                            ₹{TAXES.toFixed(2)}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>

                                                <Divider sx={{ borderStyle: 'dashed' }} />

                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <Typography variant="h6" fontWeight={700}>
                                                        Total Amount
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight={800} color="primary.main">
                                                        ₹{orderTotal.toFixed(2)}
                                                    </Typography>
                                                </Stack>

                                                <LoadingButton
                                                    fullWidth
                                                    size="large"
                                                    variant="contained"
                                                    loading={isOnlinePaying}
                                                    onClick={handlePayClick}
                                                    disabled={!selectedAddress || !itemsToCheckout.length || hasInvalidItems}
                                                    startIcon={<LockIcon />}
                                                    sx={{
                                                        py: 1.75,
                                                        textTransform: 'none',
                                                        fontSize: '1.05rem',
                                                        fontWeight: 700,
                                                        borderRadius: 2,
                                                        boxShadow: 3,
                                                        '&:hover': {
                                                            boxShadow: 5,
                                                            transform: 'translateY(-2px)'
                                                        },
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {isOnlinePaying ? 'Processing Payment...' : 'Proceed to Secure Payment'}
                                                </LoadingButton>

                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    gap={1}
                                                    sx={{
                                                        p: 1.5,
                                                        bgcolor: alpha(theme.palette.success.main, 0.08),
                                                        borderRadius: 2,
                                                        border: '1px solid',
                                                        borderColor: alpha(theme.palette.success.main, 0.2)
                                                    }}
                                                >
                                                    <LockIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                    <Typography
                                                        variant="body2"
                                                        color="success.main"
                                                        fontWeight={600}
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                    >
                                                        Powered by
                                                        <img
                                                            src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                                                            alt="Razorpay"
                                                            style={{ height: 18, marginLeft: 4 }}
                                                        />
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </motion.div>
                        </Grid>
                    </Grid>
                )}
            </Container>

            <PaymentSuccessDialog
                open={showSuccessAnimation.open}
                orderId={showSuccessAnimation.orderId}
                onViewOrder={handleViewOrder}
            />


            {/* ====================== OTP DISABLED (OPTION A) ======================
                The OTPDialog render is commented out so OTP is completely bypassed.
                Re-enable by un-commenting the block and the OTP import at the top.
            */}
            {/*
            <OTPDialog
                open={otpDialogOpen}
                phone={otpTargetPhone}
                onVerified={handleOtpVerified}
                onClose={() => setOtpDialogOpen(false)}
            />
            */}
        </Box>
    )
}

export default Checkout
