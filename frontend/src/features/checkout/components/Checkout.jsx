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
    useTheme,
    useMediaQuery,
    alpha,
    Container,
    Radio,
    RadioGroup,
    FormControlLabel,
    Collapse
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
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { SHIPPING, TAXES } from '../../../constants'
import { toast } from 'react-toastify'
import { axiosi } from '../../../config/axios'
import PaymentSuccessDialog from '../../../dialogs/PaymentSuccessDialog'

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
    const [expandSummary, setExpandSummary] = useState(false)

    const [showSuccessAnimation, setShowSuccessAnimation] = useState({
        open: false,
        orderId: null
    })

    const passedSelectedItems = location.state?.selectedItems || null
    const buyNowItem = location.state?.buyNow ? location.state?.product : null

    const formattedBuyNowItem = buyNowItem
        ? [{
            cartItemId: null,
            product: {
                _id: buyNowItem._id,
                title: buyNowItem.title,
                price: buyNowItem.price,
                thumbnail: buyNowItem.thumbnail,
                brand: { name: buyNowItem.brand }
            },
            quantity: buyNowItem.quantity,
            size: buyNowItem.size || null,
            price: buyNowItem.price
        }]
        : null

    const itemsToCheckout = useMemo(() => {
        if (formattedBuyNowItem) return formattedBuyNowItem
        if (passedSelectedItems?.length) return passedSelectedItems
        return cartItems.map(ci => ({
            cartItemId: ci._id,
            product: ci.product,
            quantity: ci.quantity,
            size: ci.size || null,
            price: (typeof ci.price === 'number' ? ci.price : (ci.product?.price ?? 0))
        }))
    }, [passedSelectedItems, cartItems, formattedBuyNowItem])

    const hasInvalidItems = useMemo(() =>
            itemsToCheckout.some(it => !it.product || !it.product._id || typeof (it.price ?? it.product.price) !== 'number'),
        [itemsToCheckout]
    )

    const orderSubtotal = useMemo(() => itemsToCheckout.reduce((acc, item) => {
        if (!item.product || typeof (item.price ?? item.product.price) !== 'number') return acc
        const unitPrice = (typeof item.price === 'number' && !Number.isNaN(item.price)) ? item.price : item.product.price
        return acc + (unitPrice * item.quantity)
    }, 0), [itemsToCheckout])

    const orderTotal = orderSubtotal + SHIPPING + TAXES

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
                const onlySelected = passedSelectedItems || null
                if (onlySelected) {
                    await Promise.all(
                        onlySelected
                            .filter(ci => ci.cartItemId)
                            .map(ci =>
                                dispatch(deleteCartItemByIdAsync(ci.cartItemId)).unwrap()
                            )
                    )
                } else if (!formattedBuyNowItem && loggedInUser?._id) {
                    await dispatch(resetCartByUserIdAsync(loggedInUser._id)).unwrap()
                }
            } catch (err) {
                // Error handling
            }
        },
        [dispatch, passedSelectedItems, formattedBuyNowItem, loggedInUser]
    )

    const handleAddAddress = (data) => {
        if (!loggedInUser?._id) {
            toast.error('Please login.')
            return
        }
        dispatch(addAddressAsync({ ...data, user: loggedInUser._id }))
    }

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
                        })

                        setIsOnlinePaying(false)
                        setShowSuccessAnimation({
                            open: true,
                            orderId: data.orderId
                        })
                    } catch (err) {
                        console.error(err)
                        toast.error('Payment verification failed. If amount is debited, please contact support.')
                        setIsOnlinePaying(false)
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
            toast.error("Order ID missing")
            return
        }

        navigate(`/order-success/${orderId}`)

        setTimeout(() => {
            finalizeCartAfterOrder(orderId)
            setShowSuccessAnimation({ open: false, orderId: null })
        }, 50)
    }

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

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
            {/* Header */}
            <Box
                sx={{
                    bgcolor: 'white',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: { xs: 1.5, md: 2 },
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                }}
            >
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton
                            component={Link}
                            to="/cart"
                            size={isMobile ? 'small' : 'medium'}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
                                Checkout
                            </Typography>
                            {!isMobile && (
                                <Typography variant="caption" color="text.secondary">
                                    Complete your purchase securely
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
                <Grid container spacing={{ xs: 2, md: 3 }}>
                    {/* Main Content */}
                    <Grid item xs={12} md={7} lg={8}>
                        <Stack spacing={2}>
                            {/* Delivery Address */}
                            <Paper sx={{ p: { xs: 2, md: 3 } }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Delivery Address
                                </Typography>

                                <RadioGroup
                                    value={selectedAddressId}
                                    onChange={(e) => setSelectedAddressId(e.target.value)}
                                >
                                    <Stack spacing={1.5}>
                                        {addresses.map((address) => (
                                            <Paper
                                                key={address._id}
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '2px solid',
                                                    borderColor: selectedAddressId === address._id
                                                        ? 'primary.main'
                                                        : 'divider',
                                                    bgcolor: selectedAddressId === address._id
                                                        ? alpha(theme.palette.primary.main, 0.04)
                                                        : 'transparent',
                                                    '&:hover': {
                                                        borderColor: 'primary.main'
                                                    }
                                                }}
                                                onClick={() => setSelectedAddressId(address._id)}
                                            >
                                                <Stack direction="row" spacing={2}>
                                                    <Radio
                                                        checked={selectedAddressId === address._id}
                                                        value={address._id}
                                                    />
                                                    <Box flex={1}>
                                                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                            <Chip
                                                                icon={getAddressIcon(address.type)}
                                                                label={address.type}
                                                                size="small"
                                                                color={selectedAddressId === address._id ? 'primary' : 'default'}
                                                            />
                                                        </Stack>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {address.street}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {address.city}, {address.state} {address.postalCode}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {address.country}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Phone: {address.phoneNumber}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </RadioGroup>

                                {!showAddressForm && (
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddressForm(true)}
                                        sx={{ mt: 2, textTransform: 'none' }}
                                    >
                                        Add New Address
                                    </Button>
                                )}

                                <Collapse in={showAddressForm}>
                                    <Box
                                        component="form"
                                        onSubmit={handleSubmit(handleAddAddress)}
                                        sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}
                                    >
                                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                            New Address
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Address Type"
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
                                        <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => {
                                                    reset()
                                                    setShowAddressForm(false)
                                                }}
                                                sx={{
                                                    textTransform: 'none',
                                                    px: 2,
                                                    py: 0.5,
                                                    minWidth: 'auto'
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <LoadingButton
                                                type="submit"
                                                variant="contained"
                                                size="small"
                                                loading={addressStatus === 'pending'}
                                                sx={{
                                                    textTransform: 'none',
                                                    px: 2,
                                                    py: 0.5,
                                                    minWidth: 'auto'
                                                }}
                                            >
                                                Save Address
                                            </LoadingButton>
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Order Summary Sidebar */}
                    <Grid item xs={12} md={5} lg={4}>
                        <Paper
                            sx={{
                                p: { xs: 2, md: 3 },
                                position: { md: 'sticky' },
                                top: { md: 80 }
                            }}
                        >
                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={600}>
                                        Order Summary
                                    </Typography>
                                    {isMobile && (
                                        <IconButton size="small" onClick={() => setExpandSummary(!expandSummary)}>
                                            {expandSummary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    )}
                                </Stack>

                                <Collapse in={!isMobile || expandSummary}>
                                    <Stack spacing={2}>
                                        {/* Items */}
                                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                            <Stack spacing={1.5}>
                                                {itemsToCheckout.map((item, idx) => {
                                                    const product = item.product || null
                                                    const unitPrice = (typeof item.price === 'number' && !Number.isNaN(item.price))
                                                        ? item.price
                                                        : product?.price || 0
                                                    const lineTotal = unitPrice * item.quantity

                                                    return (
                                                        <Stack key={idx} direction="row" spacing={1.5}>
                                                            <Box
                                                                sx={{
                                                                    width: 60,
                                                                    height: 60,
                                                                    borderRadius: 1,
                                                                    overflow: 'hidden',
                                                                    bgcolor: '#f5f5f5',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                <img
                                                                    src={product?.thumbnail || "/placeholder.png"}
                                                                    alt={product?.title || "Product"}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Box flex={1}>
                                                                <Typography variant="body2" fontWeight={500} noWrap>
                                                                    {product?.title || "Product"}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Qty: {item.quantity}
                                                                    </Typography>
                                                                    {item.size && (
                                                                        <>
                                                                            <Typography variant="caption">•</Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Size: {item.size}
                                                                            </Typography>
                                                                        </>
                                                                    )}
                                                                </Stack>
                                                                <Typography variant="body2" fontWeight={600} color="primary">
                                                                    ₹{lineTotal.toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    )
                                                })}
                                            </Stack>
                                        </Box>

                                        <Divider />

                                        {/* Price Breakdown */}
                                        <Stack spacing={1}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Subtotal
                                                </Typography>
                                                <Typography variant="body2">
                                                    ₹{orderSubtotal.toFixed(2)}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Shipping
                                                </Typography>
                                                <Typography variant="body2">
                                                    ₹{SHIPPING.toFixed(2)}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Taxes
                                                </Typography>
                                                <Typography variant="body2">
                                                    ₹{TAXES.toFixed(2)}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        <Divider />

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6" fontWeight={700}>
                                                Total
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="primary">
                                                ₹{orderTotal.toFixed(2)}
                                            </Typography>
                                        </Stack>

                                        <LoadingButton
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            loading={isOnlinePaying}
                                            onClick={handlePayClick}
                                            disabled={!selectedAddress || !itemsToCheckout.length || hasInvalidItems}
                                            startIcon={<LockIcon />}
                                            sx={{
                                                py: 1.5,
                                                textTransform: 'none',
                                                fontWeight: 600
                                            }}
                                        >
                                            {isOnlinePaying ? 'Processing...' : 'Pay Securely'}
                                        </LoadingButton>

                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="center"
                                            spacing={0.5}
                                            sx={{
                                                py: 1,
                                                px: 2,
                                                bgcolor: alpha(theme.palette.success.main, 0.08),
                                                borderRadius: 1
                                            }}
                                        >
                                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                            <Typography variant="caption" color="success.main" fontWeight={500}>
                                                Secured by Razorpay
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Collapse>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <PaymentSuccessDialog
                open={showSuccessAnimation.open}
                orderId={showSuccessAnimation.orderId}
                onViewOrder={handleViewOrder}
            />
        </Box>
    )
}

export default Checkout