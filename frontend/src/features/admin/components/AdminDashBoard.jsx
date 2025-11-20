// frontend/src/features/admin/components/AdminDashBoard.jsx
import {
    Button,
    Grid,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
    Chip,
    Box,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Fab,
    Paper,
    IconButton,
    Tooltip,
    Pagination,
    TextField,
    InputAdornment,
    MenuItem   // <-- ADD THIS
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AddIcon from '@mui/icons-material/Add'
import {
    deleteProductByIdAsync,
    fetchProductsAsync,
    selectProductTotalResults,
    selectProducts,
    undeleteProductByIdAsync,
    forceDeleteProductByIdAsync,
    selectProductFetchStatus
} from '../../products/ProductSlice'
import { Link } from 'react-router-dom'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import RestoreIcon from '@mui/icons-material/Restore'
import InventoryIcon from '@mui/icons-material/Inventory'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import { ITEMS_PER_PAGE } from '../../../constants'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import { selectProductStats, fetchProductStatsAsync } from "../../products/ProductSlice";


const sortOptions = [
    { label: 'Newest first', sort: 'createdAt', order: 'desc' },
    { label: 'Oldest first', sort: 'createdAt', order: 'asc' },
    { label: 'Price: low to high', sort: 'price', order: 'asc' },
    { label: 'Price: high to low', sort: 'price', order: 'desc' },
    { label: 'Stock: low to high', sort: 'stockQuantity', order: 'asc' },
    { label: 'Stock: high to low', sort: 'stockQuantity', order: 'desc' }
]

// Skeleton card for loading state
const ProductCardSkeleton = () => (
    <Card
        elevation={0}
        sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            bgcolor: '#f9fafb'
        }}
    >
        <Box
            sx={{
                height: 180,
                bgcolor: '#e5e7eb',
                borderRadius: 2
            }}
        />
        <CardContent sx={{ p: 2 }}>
            <Box sx={{ width: '40%', height: 10, bgcolor: '#e5e7eb', mb: 1, borderRadius: 10 }} />
            <Box sx={{ width: '100%', height: 10, bgcolor: '#e5e7eb', mb: 0.5, borderRadius: 10 }} />
            <Box sx={{ width: '80%', height: 10, bgcolor: '#e5e7eb', mb: 1.5, borderRadius: 10 }} />
            <Box sx={{ width: '30%', height: 14, bgcolor: '#e5e7eb', borderRadius: 10 }} />
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
            <Box sx={{ width: '100%', display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, height: 32, bgcolor: '#e5e7eb', borderRadius: 999 }} />
                <Box sx={{ width: 32, height: 32, bgcolor: '#e5e7eb', borderRadius: 999 }} />
            </Box>
        </CardActions>
    </Card>
)

export const AdminDashBoard = () => {
    const [page, setPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState(null) // null | 'active' | 'deleted'
    const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })
    const [forceDeleteDialog, setForceDeleteDialog] = useState({ open: false, product: null })
    const [grandTotal, setGrandTotal] = useState(0)

    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sort, setSort] = useState(null)

    const products = useSelector(selectProducts)
    const filteredTotal = useSelector(selectProductTotalResults)
    const productFetchStatus = useSelector(selectProductFetchStatus)

    const dispatch = useDispatch()
    const theme = useTheme()

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const totalPages = Math.ceil(filteredTotal / ITEMS_PER_PAGE)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim())
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        dispatch(fetchProductStatsAsync());
    }, []);

    // Auto refresh stats whenever product list updates
    useEffect(() => {
        dispatch(fetchProductStatsAsync());
    }, [products]);


    // Reset page when total changes
    useEffect(() => {
        setPage(1)
    }, [filteredTotal])

    // Track grand total when no filter is active
    useEffect(() => {
        if (activeFilter === null) {
            setGrandTotal(filteredTotal)
        }
    }, [filteredTotal, activeFilter])

    // Fetch products (with filter, search, sort, pagination)
    useEffect(() => {
        const finalFilters = {
            pagination: { page: page, limit: ITEMS_PER_PAGE }
        }

        // Filter by deleted vs active
        if (activeFilter === 'deleted') {
            finalFilters.isDeleted = true
        } else if (activeFilter === 'active') {
            finalFilters.isDeleted = false
        }

        // Sorting
        if (sort) {
            finalFilters.sort = sort
        }

        // Search
        if (debouncedSearch) {
            finalFilters.search = debouncedSearch
        }

        dispatch(fetchProductsAsync(finalFilters))
    }, [page, activeFilter, sort, debouncedSearch, dispatch])

    const handleProductDelete = (product) => {
        setDeleteDialog({ open: true, product })
    }

    const confirmDelete = () => {
        if (deleteDialog.product?._id) {
            dispatch(deleteProductByIdAsync(deleteDialog.product._id))
        }
        setDeleteDialog({ open: false, product: null })
    }

    const handleProductUnDelete = (productId) => {
        dispatch(undeleteProductByIdAsync(productId))
    }

    const handleForceDelete = (product) => {
        setForceDeleteDialog({ open: true, product })
    }

    const confirmForceDelete = () => {
        if (forceDeleteDialog.product?._id) {
            dispatch(forceDeleteProductByIdAsync(forceDeleteDialog.product._id))
        }
        setForceDeleteDialog({ open: false, product: null })
    }

    const handlePageChange = (event, value) => {
        setPage(value)
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const handleFilterClick = (filterKey) => {
        if (filterKey === null) {
            setActiveFilter(null)
        } else {
            setActiveFilter(activeFilter === filterKey ? null : filterKey)
        }
        setPage(1)
    }

    const statsGlobal = useSelector(selectProductStats);
    const stats = [
        {
            label: "Total Products",
            value: statsGlobal.total,
            icon: ShoppingBagIcon,
            color: "#2563eb",
            filterKey: null
        },
        {
            label: "Active Products",
            value: statsGlobal.active,
            icon: TrendingUpIcon,
            color: "#16a34a",
            filterKey: "active"
        },
        {
            label: "Deleted Products",
            value: statsGlobal.deleted,
            icon: DeleteOutlineIcon,
            color: "#dc2626",
            filterKey: "deleted"
        }
    ];


    const isLoading = productFetchStatus === 'pending'

    return (
        <>
            <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pb: { xs: 10, sm: 4 } }}>
                {/* Header */}
                <Box
                    sx={{
                        bgcolor: 'white',
                        borderBottom: '1px solid #e5e7eb',
                        py: { xs: 2.5, sm: 3.5 },
                        px: { xs: 2, sm: 3, md: 4 },
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={{ xs: 2, sm: 0 }}
                        sx={{ maxWidth: '1400px', mx: 'auto' }}
                    >
                        <Box>
                            <Typography
                                variant={isMobile ? 'h5' : 'h4'}
                                fontWeight={600}
                                sx={{ letterSpacing: '-0.02em' }}
                            >
                                Inventory Management
                            </Typography>
                            <Typography variant='body2' color="text.secondary" sx={{ mt: 0.5 }}>
                                Search, filter and manage your boutique products
                            </Typography>
                        </Box>

                        {!isMobile && (
                            <Button
                                component={Link}
                                to="/admin/add-product"
                                variant="contained"
                                size="medium"
                                startIcon={<AddIcon />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: 2,
                                    px: 3,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: 'none'
                                    }
                                }}
                            >
                                Add Product
                            </Button>
                        )}
                    </Stack>
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        maxWidth: '1400px',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 3, sm: 4 }
                    }}
                >
                    {/* Stats Cards */}
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {stats.map((stat) => {
                            const Icon = stat.icon
                            const isActive = activeFilter === stat.filterKey
                            const isClickable = stat.filterKey !== null

                            return (
                                <Grid item xs={4} sm={4} key={stat.label}>
                                    <Paper
                                        onClick={() => isClickable && handleFilterClick(stat.filterKey)}
                                        elevation={0}
                                        sx={{
                                            p: { xs: 1.5, sm: 2.5 },
                                            cursor: isClickable ? 'pointer' : 'default',
                                            border: '1px solid',
                                            borderColor: isActive ? stat.color : '#e5e7eb',
                                            bgcolor: isActive ? `${stat.color}0a` : 'white',
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            '&:hover': isClickable
                                                ? {
                                                    borderColor: stat.color,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 12px ${stat.color}20`
                                                }
                                                : {}
                                        }}
                                    >
                                        <Stack spacing={{ xs: 0.5, sm: 1 }}>
                                            <Icon
                                                sx={{
                                                    fontSize: { xs: 20, sm: 28 },
                                                    color: stat.color,
                                                    opacity: 0.9
                                                }}
                                            />
                                            <Box>
                                                <Typography
                                                    variant={isMobile ? 'h6' : 'h4'}
                                                    fontWeight={600}
                                                    sx={{ letterSpacing: '-0.02em' }}
                                                >
                                                    {stat.value}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                                        display: 'block',
                                                        mt: 0.5
                                                    }}
                                                >
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            )
                        })}
                    </Grid>

                    {/* Active Filter Chip */}
                    {activeFilter && (
                        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                            <Chip
                                label={stats.find(s => s.filterKey === activeFilter)?.label}
                                onDelete={() => handleFilterClick(null)}
                                color="primary"
                                size={isMobile ? 'small' : 'medium'}
                                sx={{
                                    fontWeight: 500,
                                    borderRadius: 1.5
                                }}
                            />
                        </Box>
                    )}

                    {/* Search + Sort Row */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                        sx={{ mt: { xs: 3, sm: 4 } }}
                    >
                        {/* Search */}
                        <TextField
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title, brand, category..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                            size="small"
                            sx={{
                                maxWidth: { sm: '420px', md: '480px' },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 999
                                }
                            }}
                        />

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            {/* Sort */}
                            <TextField
                                select
                                size="small"
                                value={sort || ''}
                                onChange={(e) => setSort(e.target.value || null)}
                                label="Sort"
                                SelectProps={{
                                    renderValue: (val) => (val ? val.label : 'Default')
                                }}
                                sx={{
                                    minWidth: 180,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 999
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SortIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                            >
                                <MenuItem value="">
                                    <em>Default</em>
                                </MenuItem>
                                {sortOptions.map((s) => (
                                    <MenuItem key={s.label} value={s}>
                                        {s.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            {/* Clear search (if any) */}
                            {(debouncedSearch || sort) && (
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setDebouncedSearch('')
                                        setSort(null)
                                        setPage(1)
                                    }}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    {/* Products Grid / Empty / Loading */}
                    <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                        {isLoading ? (
                            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <Grid item xs={6} sm={6} md={4} lg={3} key={idx}>
                                        <ProductCardSkeleton />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : products.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 4, sm: 6 },
                                    textAlign: 'center',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 2
                                }}
                            >
                                <InventoryIcon
                                    sx={{
                                        fontSize: { xs: 48, sm: 64 },
                                        color: 'text.secondary',
                                        mb: 2,
                                        opacity: 0.5
                                    }}
                                />
                                <Typography variant="h6" gutterBottom fontWeight={600}>
                                    No products found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    {activeFilter || debouncedSearch || sort
                                        ? 'No products match the current filters'
                                        : 'Start by adding your first product'}
                                </Typography>
                                {activeFilter || debouncedSearch || sort ? (
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setActiveFilter(null)
                                            setSearchQuery('')
                                            setDebouncedSearch('')
                                            setSort(null)
                                            setPage(1)
                                        }}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <Button
                                        component={Link}
                                        to="/admin/add-product"
                                        variant="contained"
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            boxShadow: 'none'
                                        }}
                                    >
                                        Add Product
                                    </Button>
                                )}
                            </Paper>
                        ) : (
                            <>
                                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                    {products.map((product) => (
                                        <Grid item xs={6} sm={6} md={4} lg={3} key={product._id}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    opacity: product.isDeleted ? 0.6 : 1,
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                                                        borderColor: '#d1d5db'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ position: 'relative' }}>
                                                    {product.isDeleted && (
                                                        <Chip
                                                            label="Deleted"
                                                            color="error"
                                                            size="small"
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                                zIndex: 1,
                                                                borderRadius: 1,
                                                                height: 24,
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    )}
                                                    <CardMedia
                                                        component="img"
                                                        height={isMobile ? '160' : '200'}
                                                        image={product.thumbnail}
                                                        alt={product.title}
                                                        sx={{
                                                            objectFit: 'cover',
                                                            bgcolor: '#f9fafb'
                                                        }}
                                                    />
                                                </Box>

                                                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                                                    <Typography
                                                        variant="caption"
                                                        color="primary"
                                                        sx={{
                                                            textTransform: 'uppercase',
                                                            fontWeight: 600,
                                                            display: 'block',
                                                            mb: 0.5,
                                                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                                            letterSpacing: '0.05em'
                                                        }}
                                                    >
                                                        {product.brand?.name || 'No brand'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={500}
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            minHeight: { xs: '2.5em', sm: '3em' },
                                                            mb: 1,
                                                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                            lineHeight: 1.4
                                                        }}
                                                    >
                                                        {product.title}
                                                    </Typography>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography
                                                                variant={isMobile ? 'body1' : 'h6'}
                                                                fontWeight={600}
                                                            >
                                                                ₹{product.price}
                                                            </Typography>
                                                            {product.discountPercentage > 0 && (
                                                                <Chip
                                                                    label={`${product.discountPercentage}%`}
                                                                    color="error"
                                                                    size="small"
                                                                    sx={{
                                                                        height: { xs: 18, sm: 20 },
                                                                        fontSize: {
                                                                            xs: '0.65rem',
                                                                            sm: '0.7rem'
                                                                        },
                                                                        borderRadius: 0.5
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>

                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ fontSize: '0.7rem' }}
                                                        >
                                                            Stock: {product.stockQuantity}
                                                        </Typography>
                                                    </Stack>

                                                    {product.stockQuantity < 10 && !product.isDeleted && (
                                                        <Alert
                                                            severity="warning"
                                                            sx={{
                                                                mt: 1,
                                                                py: 0.5,
                                                                '& .MuiAlert-icon': {
                                                                    fontSize: { xs: 16, sm: 20 }
                                                                }
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontSize: {
                                                                        xs: '0.65rem',
                                                                        sm: '0.75rem'
                                                                    }
                                                                }}
                                                            >
                                                                Low stock: {product.stockQuantity}
                                                            </Typography>
                                                        </Alert>
                                                    )}
                                                </CardContent>

                                                <CardActions sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
                                                    <Stack direction="row" spacing={1} width="100%">
                                                        <Button
                                                            component={Link}
                                                            to={`/admin/product-update/${product._id}`}
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={
                                                                <EditIcon
                                                                    sx={{ fontSize: { xs: 16, sm: 18 } }}
                                                                />
                                                            }
                                                            fullWidth
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontWeight: 500,
                                                                borderRadius: 1.5,
                                                                fontSize: {
                                                                    xs: '0.7rem',
                                                                    sm: '0.8rem'
                                                                },
                                                                py: { xs: 0.5, sm: 0.75 }
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>

                                                        {product.isDeleted ? (
                                                            <>
                                                                <Button
                                                                    onClick={() =>
                                                                        handleProductUnDelete(product._id)
                                                                    }
                                                                    variant="outlined"
                                                                    color="success"
                                                                    size="small"
                                                                    startIcon={
                                                                        <RestoreIcon
                                                                            sx={{
                                                                                fontSize: {
                                                                                    xs: 16,
                                                                                    sm: 18
                                                                                }
                                                                            }}
                                                                        />
                                                                    }
                                                                    fullWidth
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontWeight: 500,
                                                                        borderRadius: 1.5,
                                                                        fontSize: {
                                                                            xs: '0.7rem',
                                                                            sm: '0.8rem'
                                                                        },
                                                                        py: { xs: 0.5, sm: 0.75 }
                                                                    }}
                                                                >
                                                                    {isMobile ? '' : 'Restore'}
                                                                </Button>
                                                                <Tooltip title="Delete Permanently">
                                                                    <IconButton
                                                                        onClick={() =>
                                                                            handleForceDelete(product)
                                                                        }
                                                                        color="error"
                                                                        size="small"
                                                                        sx={{
                                                                            border: '1px solid',
                                                                            borderColor: 'error.main',
                                                                            borderRadius: 1.5,
                                                                            width: {
                                                                                xs: 32,
                                                                                sm: 40
                                                                            },
                                                                            height: {
                                                                                xs: 32,
                                                                                sm: 40
                                                                            }
                                                                        }}
                                                                    >
                                                                        <DeleteForeverIcon
                                                                            sx={{
                                                                                fontSize: {
                                                                                    xs: 16,
                                                                                    sm: 20
                                                                                }
                                                                            }}
                                                                        />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        ) : (
                                                            <Tooltip title="Delete">
                                                                <IconButton
                                                                    onClick={() =>
                                                                        handleProductDelete(product)
                                                                    }
                                                                    color="error"
                                                                    size="small"
                                                                    sx={{
                                                                        border: '1px solid',
                                                                        borderColor: 'error.main',
                                                                        borderRadius: 1.5,
                                                                        width: { xs: 32, sm: 40 },
                                                                        height: { xs: 32, sm: 40 }
                                                                    }}
                                                                >
                                                                    <DeleteOutlineIcon
                                                                        sx={{
                                                                            fontSize: {
                                                                                xs: 16,
                                                                                sm: 20
                                                                            }
                                                                        }}
                                                                    />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <Stack
                                        alignItems="center"
                                        mt={{ xs: 3, sm: 4 }}
                                        spacing={1}
                                    >
                                        <Pagination
                                            count={totalPages}
                                            page={page}
                                            onChange={handlePageChange}
                                            color="primary"
                                            size={isMobile ? 'small' : 'medium'}
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    borderRadius: 1.5
                                                }
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            mt={1}
                                        >
                                            Page {page} of {totalPages} • {filteredTotal} products
                                        </Typography>
                                    </Stack>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Soft Delete Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, product: null })}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        m: { xs: 2, sm: 3 }
                    }
                }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                bgcolor: '#fee2e2',
                                borderRadius: 2,
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <DeleteOutlineIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                            Delete Product
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete{' '}
                        <strong>"{deleteDialog.product?.title}"</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1.5}>
                        You can restore it later if needed.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button
                        onClick={() => setDeleteDialog({ open: false, product: null })}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 1.5
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 1.5,
                            boxShadow: 'none'
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Force Delete Dialog */}
            <Dialog
                open={forceDeleteDialog.open}
                onClose={() => setForceDeleteDialog({ open: false, product: null })}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        m: { xs: 2, sm: 3 }
                    }
                }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                bgcolor: '#fee2e2',
                                borderRadius: 2,
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <DeleteForeverIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                            Permanently Delete
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to permanently delete{' '}
                        <strong>"{forceDeleteDialog.product?.title}"</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1.5}>
                        This will remove the product from the database completely.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button
                        onClick={() =>
                            setForceDeleteDialog({ open: false, product: null })
                        }
                        sx={{
                            textTransform: 'none',
                            borderRadius: 1.5
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmForceDelete}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 1.5,
                            boxShadow: 'none'
                        }}
                    >
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Mobile FAB */}
            {isMobile && (
                <Fab
                    color="primary"
                    component={Link}
                    to="/admin/add-product"
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    <AddIcon />
                </Fab>
            )}
        </>
    )
}
