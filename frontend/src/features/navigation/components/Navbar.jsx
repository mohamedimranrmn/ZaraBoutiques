import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Stack, useMediaQuery, useTheme, Box, Divider, TextField, InputAdornment, Button, Chip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { selectCartItems } from '../../cart/CartSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

export const Navbar = ({ onFilterClick, activeFilterCount = 0 }) => {
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [localSearch, setLocalSearch] = React.useState(searchParams.get('search') || '');

    const userInfo = useSelector(selectUserInfo);
    const cartItems = useSelector(selectCartItems);
    const loggedInUser = useSelector(selectLoggedInUser);
    const wishlistItems = useSelector(selectWishlistItems);

    const navigate = useNavigate();
    const theme = useTheme();
    const is600 = useMediaQuery(theme.breakpoints.down(600));

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (localSearch.trim()) {
                params.set('search', localSearch.trim());
            } else {
                params.delete('search');
            }
            params.delete('page'); // Reset to page 1 on search
            setSearchParams(params);
        }, 400);

        return () => clearTimeout(timer);
    }, [localSearch]);

    // Sync with URL params
    React.useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== localSearch) {
            setLocalSearch(urlSearch);
        }
    }, [searchParams.get('search')]);

    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const handleClearSearch = () => {
        setLocalSearch('');
        const params = new URLSearchParams(searchParams);
        params.delete('search');
        params.delete('page');
        setSearchParams(params);
    };

    const handleSort = (sortType) => {
        const params = new URLSearchParams(searchParams);
        const currentSort = searchParams.get('sort');

        if (currentSort === sortType) {
            params.delete('sort');
        } else {
            params.set('sort', sortType);
        }
        params.delete('page');
        setSearchParams(params);
    };

    const currentSort = searchParams.get('sort') || '';

    // Filter settings based on user role
    const settings = loggedInUser?.isAdmin
        ? [
            { name: "Home", to: "/" },
            { name: 'Orders', to: "/admin/orders" },
            { name: 'Logout', to: "/logout" },
        ]
        : [
            { name: "Home", to: "/" },
            { name: 'Profile', to: "/profile" },
            { name: 'My Orders', to: "/orders" },
            { name: 'Logout', to: "/logout" },
        ];

    return (
        <AppBar
            position="sticky"
            sx={{
                backgroundColor: "#ffffff",
                color: "#000000",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderBottom: "1px solid #F0F0F0",
            }}
        >
            <Toolbar
                sx={{
                    px: is600 ? 2 : 4,
                    minHeight: is600 ? 60 : 70,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                {/* ------------------ LOGO ------------------ */}
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: ".15rem",
                        textDecoration: "none",
                        background: "linear-gradient(45deg, #000, #FF4444)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontSize: is600 ? "1rem" : "1.5rem",
                        flexShrink: 0
                    }}
                >
                    ZARA BOUTIQUES
                </Typography>

                {/* ------------------ DESKTOP SEARCH ------------------ */}
                {!is600 && !loggedInUser?.isAdmin && (
                    <Box sx={{ flexGrow: 1, mx: 4, maxWidth: 600 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search products, brands, categories..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: localSearch && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleClearSearch}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#f5f5f5',
                                    '& fieldset': {
                                        borderColor: 'transparent'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#e0e0e0'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#FF4444',
                                        borderWidth: 1
                                    }
                                }
                            }}
                        />
                    </Box>
                )}

                {/* ------------------ RIGHT SECTION ------------------ */}
                <Stack direction="row" alignItems="center" gap={is600 ? 1 : 2}>
                    {/* Wishlist */}
                    {!loggedInUser?.isAdmin && (
                        <Tooltip title="Wishlist">
                            <IconButton
                                component={Link}
                                to="/wishlist"
                                sx={{ color: "#000" }}
                            >
                                <Badge badgeContent={wishlistItems?.length} color="error">
                                    <FavoriteBorderIcon sx={{ fontSize: is600 ? 20 : 24 }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Cart */}
                    {!loggedInUser?.isAdmin && (
                        <Tooltip title="Cart">
                            <IconButton
                                onClick={() => navigate("/cart")}
                                sx={{ color: "#000" }}
                            >
                                <Badge badgeContent={cartItems?.length} color="error">
                                    <ShoppingCartOutlinedIcon sx={{ fontSize: is600 ? 20 : 24 }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* User Avatar */}
                    <Tooltip title="Account">
                        <IconButton
                            onClick={handleOpenUserMenu}
                            sx={{
                                p: 0,
                                borderRadius: "50%",
                                "&:hover": { opacity: 0.8 }
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: is600 ? 32 : 40,
                                    height: is600 ? 32 : 40,
                                    backgroundColor: "#FF4444",
                                    fontWeight: 700
                                }}
                            >
                                {userInfo?.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    {/* ------------------ DROPDOWN MENU ------------------ */}
                    <Menu
                        anchorEl={anchorElUser}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        PaperProps={{
                            elevation: 6,
                            sx: {
                                width: 240,
                                borderRadius: 0,
                                overflow: "hidden",
                                mt: 0,
                                border: "none",
                                outline: "none",
                                boxShadow: "0px 8px 28px rgba(0,0,0,0.15)",
                                position: "fixed !important",
                                right: "0 !important",
                                left: "auto !important",
                                top: is600 ? "60px !important" : "70px !important",
                            }
                        }}
                    >
                        {/* HEADER */}
                        <Box sx={{ px: 2, py: 2, bgcolor: "#fafafa" }}>
                            <Typography fontWeight={700} fontSize="1rem">
                                {userInfo?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {userInfo?.email}
                            </Typography>
                            {loggedInUser?.isAdmin && (
                                <Chip
                                    label="Admin"
                                    size="small"
                                    color="error"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>

                        <Divider />

                        {/* MENU ITEMS */}
                        {settings.map((item) => (
                            <MenuItem
                                key={item.name}
                                onClick={handleCloseUserMenu}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        backgroundColor: "#FFF5F5"
                                    }
                                }}
                            >
                                <Typography
                                    component={Link}
                                    to={item.to}
                                    sx={{
                                        textDecoration: "none",
                                        color: item.name === "Logout" ? "#FF4444" : "#000",
                                        fontWeight: item.name === "Logout" ? 700 : 500,
                                        width: "100%",
                                    }}
                                >
                                    {item.name}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Menu>
                </Stack>
            </Toolbar>
        </AppBar>
    );
};