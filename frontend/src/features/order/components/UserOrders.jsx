// frontend/src/features/order/components/UserOrders.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    getOrderByUserIdAsync,
    resetOrderFetchStatus,
    selectOrderFetchStatus,
    selectOrders
} from '../OrderSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    Paper,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Menu,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import { Link } from 'react-router-dom'
import {
    addToCartAsync,
    resetCartItemAddStatus,
    selectCartItemAddStatus,
    selectCartItems
} from '../../cart/CartSlice'

import Lottie from 'lottie-react'
import { loadingAnimation, noOrdersAnimation } from '../../../assets'
import { toast } from 'react-toastify'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import SortIcon from '@mui/icons-material/Sort'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ReceiptIcon from '@mui/icons-material/Receipt'
import ClearIcon from '@mui/icons-material/Clear'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PendingIcon from '@mui/icons-material/Pending'

const statusColors = {
    'Pending': 'warning',
    'Dispatched': 'info',
    'Out for delivery': 'info',
    'Delivered': 'success',
    'Cancelled': 'error'
}

const statusIcons = {
    'Pending': PendingIcon,
    'Dispatched': LocalShippingIcon,
    'Out for delivery': LocalShippingIcon,
    'Delivered': CheckCircleIcon,
    'Cancelled': CancelIcon
}

export const UserOrders = () => {
    const dispatch = useDispatch()
    const loggedInUser = useSelector(selectLoggedInUser)
    const orders = useSelector(selectOrders)
    const cartItems = useSelector(selectCartItems)
    const orderFetchStatus = useSelector(selectOrderFetchStatus)
    const cartItemAddStatus = useSelector(selectCartItemAddStatus)

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // State for filters and search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [paymentFilter, setPaymentFilter] = useState('All')
    const [sortBy, setSortBy] = useState('newest')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [sortMenuAnchor, setSortMenuAnchor] = useState(null)
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [])

    useEffect(() => {
        if (loggedInUser?._id) {
            dispatch(getOrderByUserIdAsync(loggedInUser._id))
        }
    }, [dispatch, loggedInUser])

    useEffect(() => {
        if (cartItemAddStatus === 'fulfilled') toast.success("Product added to cart")
        else if (cartItemAddStatus === 'rejected') toast.error("Error adding product to cart")
    }, [cartItemAddStatus])

    useEffect(() => {
        if (orderFetchStatus === 'rejected') toast.error("Error fetching orders")
    }, [orderFetchStatus])

    useEffect(() => {
        return () => {
            dispatch(resetOrderFetchStatus())
            dispatch(resetCartItemAddStatus())
        }
    }, [dispatch])

    // Filter and sort orders
    const filteredAndSortedOrders = useMemo(() => {
        if (!orders) return []

        let filtered = [...orders]

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(order =>
                order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.item?.some(item =>
                    item.product?.title?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
        }

        // Status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        // Payment filter
        if (paymentFilter !== 'All') {
            if (paymentFilter === "PAID") {
                filtered = filtered.filter(order => order.paymentStatus === "PAID");
            } else if (paymentFilter === "PENDING") {
                filtered = filtered.filter(order => order.paymentStatus === "PENDING");
            }
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt)
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt)
                case 'highest':
                    return (b.finalAmount || b.total) - (a.finalAmount || a.total)
                case 'lowest':
                    return (a.finalAmount || a.total) - (b.finalAmount || b.total)
                default:
                    return 0
            }
        })

        return filtered
    }, [orders, searchQuery, statusFilter, paymentFilter, sortBy])

    const handleAddToCart = (product, size) => {
        if (!loggedInUser?._id) return;
        const item = {
            user: loggedInUser._id,
            product: product?._id,
            quantity: 1,
            size: size || null
        }
        dispatch(addToCartAsync(item))
    }

    const openDetailsDialog = (order) => {
        setSelectedOrder(order)
        setDetailsDialogOpen(true)
    }

    const handleDownloadInvoice = (orderId) => {
        window.open(`${process.env.REACT_APP_BASE_URL}/orders/${orderId}/invoice`, '_blank')
    }

    const clearFilters = () => {
        setSearchQuery('')
        setStatusFilter('All')
        setPaymentFilter('All')
        setSortBy('newest')
    }

    const hasActiveFilters = searchQuery || statusFilter !== 'All' || paymentFilter !== 'All' || sortBy !== 'newest'

    // Order Details Dialog Component
    const OrderDetailsDialog = () => {
        if (!selectedOrder) return null

        const addr = Array.isArray(selectedOrder.address)
            ? selectedOrder.address[0]
            : selectedOrder.address || {}

        return (
            <Dialog
                open={detailsDialogOpen}
                onClose={() => setDetailsDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h6" fontWeight={600}>
                                Order Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Order ID: #{selectedOrder._id.slice(-8).toUpperCase()}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setDetailsDialogOpen(false)}>
                            <ClearIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        {/* Order Status */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Order Status
                            </Typography>
                            <Chip
                                label={selectedOrder.status || 'Pending'}
                                color={statusColors[selectedOrder.status] || 'default'}
                                icon={React.createElement(statusIcons[selectedOrder.status] || PendingIcon)}
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>

                        <Divider />

                        {/* Shipping Address */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Shipping Address
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
                                <Typography variant="body2">
                                    {addr.street || ''}<br />
                                    {addr.city}, {addr.state} - {addr.postalCode}<br />
                                    Phone: {addr.phoneNumber || 'N/A'}
                                </Typography>
                            </Paper>
                        </Box>

                        <Divider />

                        {/* Order Items */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Order Items
                            </Typography>
                            <Stack spacing={2}>
                                {selectedOrder.item?.map((item, idx) => {
                                    const p = item.product || {};

                                    const imageSrc =
                                        Array.isArray(p.images) && p.images[0]
                                            ? p.images[0]
                                            : p.thumbnail || "/placeholder.png";

                                    const brandName =
                                        typeof p.brand === "object" ? p.brand?.name : p.brand || "Unknown brand";

                                    const isInCart = p?._id && cartItems.some(ci => ci.product._id === p._id)

                                    return (
                                        <Card key={idx} variant="outlined">
                                            <CardContent>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} sm={3}>
                                                        <Box
                                                            sx={{
                                                                width: '100%',
                                                                paddingTop: '100%',
                                                                position: 'relative',
                                                                bgcolor: alpha(theme.palette.grey[200], 0.3),
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            <img
                                                                src={imageSrc}
                                                                alt={p.title}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'contain',
                                                                    padding: '8px'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={12} sm={9}>
                                                        <Typography variant="body1" fontWeight={600} gutterBottom>
                                                            {p.title || 'Untitled Product'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            {brandName}
                                                        </Typography>

                                                        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }}>
                                                            <Chip
                                                                label={`Qty: ${item.quantity}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            {item.size && item.size !== null && item.size !== '' && (
                                                                <Chip
                                                                    label={`Size: ${item.size}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    sx={{ fontWeight: 600 }}
                                                                />
                                                            )}
                                                        </Stack>

                                                        <Typography variant="h6" color="primary" gutterBottom>
                                                            ₹{item.priceAtPurchase || p.price || 0}
                                                        </Typography>

                                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                            <Button
                                                                component={Link}
                                                                to={`/product-details/${p._id}`}
                                                                variant="outlined"
                                                                size="small"
                                                            >
                                                                View Details
                                                            </Button>
                                                            {isInCart ? (
                                                                <Button
                                                                    component={Link}
                                                                    to="/cart"
                                                                    variant="contained"
                                                                    size="small"
                                                                    color="success"
                                                                >
                                                                    In Cart
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    disabled={!p?._id || p.stockQuantity <= 0}
                                                                    onClick={() => {
                                                                        if (!p?._id) return;
                                                                        if (p.stockQuantity <= 0) {
                                                                            toast.error("Product is no longer in stock");
                                                                            return;
                                                                        }
                                                                        handleAddToCart(p, item.size);
                                                                    }}
                                                                >
                                                                    { !p?._id ? "Unavailable" :
                                                                        p.stockQuantity <= 0 ? "Out of Stock" :
                                                                            "Buy Again" }
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Payment Summary */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Payment Summary
                            </Typography>
                            <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Subtotal:</Typography>
                                    <Typography variant="body2">₹{selectedOrder.subtotal || selectedOrder.total}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Shipping:</Typography>
                                    <Typography variant="body2">₹{selectedOrder.shippingCharge || 0}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Tax:</Typography>
                                    <Typography variant="body2">₹{selectedOrder.taxAmount || 0}</Typography>
                                </Stack>
                                {selectedOrder.discount > 0 && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2">Discount:</Typography>
                                        <Typography variant="body2" color="success.main">-₹{selectedOrder.discount}</Typography>
                                    </Stack>
                                )}
                                <Divider />
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight={600}>Total:</Typography>
                                    <Typography variant="h6" fontWeight={600} color="primary">
                                        ₹{selectedOrder.finalAmount || selectedOrder.total}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Payment Info */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Payment Information
                            </Typography>
                            <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Payment Mode:</Typography>
                                    <Chip label={selectedOrder.paymentMode} size="small" />
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Payment Status:</Typography>
                                    <Chip
                                        label={selectedOrder.paymentStatus}
                                        size="small"
                                        color={selectedOrder.paymentStatus === 'PAID' ? 'success' : 'warning'}
                                    />
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Download Invoice Button */}
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleDownloadInvoice(selectedOrder._id)}
                            sx={{ mt: 2 }}
                        >
                            Download Invoice
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        )
    }

    if (orderFetchStatus === 'pending') {
        return (
            <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: isMobile ? '100%' : 400 }}>
                    <Lottie animationData={loadingAnimation} />
                </Box>
            </Container>
        )
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4, mb: 8 }}>
            {/* Header */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <IconButton
                    component={Link}
                    to="/"
                    sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box flex={1}>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                        My Orders
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filteredAndSortedOrders.length} {filteredAndSortedOrders.length === 1 ? 'order' : 'orders'}
                    </Typography>
                </Box>
            </Stack>

            {orders && orders.length > 0 ? (
                <>
                    {/* Search and Filter Bar */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Stack spacing={2}>
                            {/* Search Bar */}
                            <TextField
                                fullWidth
                                placeholder="Search by Order ID or Product Name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                size="small"
                            />

                            {/* Filters Row */}
                            <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                                {/* Status Filter */}
                                <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="All">All Status</MenuItem>
                                        <MenuItem value="Pending">Pending</MenuItem>
                                        <MenuItem value="Dispatched">Dispatched</MenuItem>
                                        <MenuItem value="Out for delivery">Out for delivery</MenuItem>
                                        <MenuItem value="Delivered">Delivered</MenuItem>
                                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Payment Filter */}
                                <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200 }}>
                                    <InputLabel>Payment Status</InputLabel>
                                    <Select
                                        value={paymentFilter}
                                        label="Payment Status"
                                        onChange={(e) => setPaymentFilter(e.target.value)}
                                    >
                                        <MenuItem value="All">All Payments</MenuItem>
                                        <MenuItem value="PAID">Paid</MenuItem>
                                        <MenuItem value="PENDING">Pending</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Sort By */}
                                <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200 }}>
                                    <InputLabel>Sort By</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sort By"
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <MenuItem value="newest">Newest First</MenuItem>
                                        <MenuItem value="oldest">Oldest First</MenuItem>
                                        <MenuItem value="highest">Highest Amount</MenuItem>
                                        <MenuItem value="lowest">Lowest Amount</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Clear Filters Button */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<ClearIcon />}
                                        onClick={clearFilters}
                                        sx={{ minWidth: isMobile ? '100%' : 'auto' }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Orders Grid */}
                    {filteredAndSortedOrders.length > 0 ? (
                        <Grid container spacing={3}>
                            {filteredAndSortedOrders.map((order) => {
                                const StatusIcon = statusIcons[order.status] || ShoppingBagIcon

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={order._id}>
                                        <Card
                                            elevation={0}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                height: '100%',
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    boxShadow: theme.shadows[4],
                                                    transform: 'translateY(-4px)'
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Stack spacing={2}>
                                                    {/* Order Header */}
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Order ID
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                #{order._id.slice(-8).toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            icon={<StatusIcon />}
                                                            label={order.status || 'Pending'}
                                                            color={statusColors[order.status] || 'default'}
                                                            size="small"
                                                            sx={{ fontWeight: 500 }}
                                                        />
                                                    </Stack>

                                                    {/* Order Date */}
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <CalendarTodayIcon fontSize="small" color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </Typography>
                                                    </Stack>

                                                    {/* Items Count */}
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <ShoppingBagIcon fontSize="small" color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {order.item?.length || 0} item(s)
                                                        </Typography>
                                                    </Stack>

                                                    <Divider />

                                                    {/* Payment Info */}
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Payment
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5}>
                                                                <Chip
                                                                    label={order.paymentMode}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                                <Chip
                                                                    label={order.paymentStatus}
                                                                    size="small"
                                                                    color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                                                                />
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>

                                                    {/* Total Amount */}
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Total Amount
                                                        </Typography>
                                                        <Typography variant="h5" fontWeight={600} color="primary">
                                                            ₹{order.finalAmount || order.total}
                                                        </Typography>
                                                    </Box>

                                                    {/* Action Buttons */}
                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            startIcon={<VisibilityIcon />}
                                                            onClick={() => openDetailsDialog(order)}
                                                            size="small"
                                                        >
                                                            Details
                                                        </Button>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            startIcon={<ReceiptIcon />}
                                                            onClick={() => handleDownloadInvoice(order._id)}
                                                            size="small"
                                                        >
                                                            Invoice
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '40vh', justifyContent: 'center', py: 4 }}>
                            <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                No Orders Found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Try adjusting your filters or search terms
                            </Typography>
                            <Button variant="outlined" onClick={clearFilters}>
                                Clear All Filters
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
                    <Lottie animationData={noOrdersAnimation} style={{ width: isMobile ? 200 : 400 }} />
                    <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
                        No Orders Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Start shopping to see your orders here
                    </Typography>
                    <Button component={Link} to="/" variant="contained" size="large">
                        Start Shopping
                    </Button>
                </Box>
            )}

            <OrderDetailsDialog />
        </Container>
    )
}