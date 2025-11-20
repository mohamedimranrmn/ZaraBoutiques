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
import {
    Badge,
    Stack,
    useMediaQuery,
    useTheme,
    Box,
    Divider,
    TextField,
    InputAdornment,
    Button,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import { selectCartItems } from '../../cart/CartSlice';

export const Navbar = () => {
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [localSearch, setLocalSearch] = React.useState(searchParams.get('search') || '');

    const userInfo = useSelector(selectUserInfo);
    const loggedInUser = useSelector(selectLoggedInUser);
    const wishlistItems = useSelector(selectWishlistItems);
    const cartItems = useSelector(selectCartItems);

    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('600'));

    /* -------------------------- SEARCH DEBOUNCE -------------------------- */
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (localSearch.trim()) params.set('search', localSearch.trim());
            else params.delete('search');
            params.delete('page');
            setSearchParams(params);
        }, 350);

        return () => clearTimeout(timer);
    }, [localSearch]);

    const handleClearSearch = () => {
        setLocalSearch('');
        const params = new URLSearchParams(searchParams);
        params.delete('search');
        params.delete('page');
        setSearchParams(params);
    };

    /* -------------------------- ADMIN NAVIGATION -------------------------- */
    const adminItems = [
        { label: "Home", to: "/admin/dashboard" },
        { label: "Orders", to: "/admin/orders" },
        { label: "Logout", to: "/logout" }
    ];

    /* -------------------------- USER DROPDOWN -------------------------- */
    const userMenuItems = [
        { label: "Home", to: "/" },
        { label: "Profile", to: "/profile" },
        { label: "My Orders", to: "/orders" },
        { label: "Logout", to: "/logout" }
    ];

    /* -------------------------- DROPDOWN HANDLERS -------------------------- */
    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    return (
        <AppBar
            position="sticky"
            sx={{
                background: "#fff",
                color: "#000",
                borderBottom: "1px solid #eaeaea",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            <Toolbar
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    px: isMobile ? 2 : 4,
                    minHeight: isMobile ? 58 : 70,
                }}
            >
                {/* -------------------------- LOGO -------------------------- */}
                <Typography
                    component={Link}
                    to="/"
                    sx={{
                        textDecoration: "none",
                        fontSize: isMobile ? "1rem" : "1.4rem",
                        fontWeight: 800,
                        background: "linear-gradient(45deg, #000, #E53935)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: ".1rem",
                    }}
                >
                    ZARA BOUTIQUES
                </Typography>

                {/* -------------------------- SEARCH (USER ONLY) -------------------------- */}
                {!isMobile && !loggedInUser?.isAdmin && (
                    <Box sx={{ flexGrow: 1, px: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search for products..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: localSearch && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClearSearch}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    bgcolor: "#f7f7f7",
                                }
                            }}
                        />
                    </Box>
                )}

                {/* -------------------------- ADMIN BUTTONS INLINE -------------------------- */}
                {loggedInUser?.isAdmin && (
                    <Stack direction="row" spacing={isMobile ? 1 : 2}>
                        {adminItems.map((item) => (
                            <Button
                                key={item.label}
                                component={Link}
                                to={item.to}
                                sx={{
                                    textTransform: "none",
                                    fontSize: isMobile ? ".65rem" : ".85rem",
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    px: isMobile ? 1 : 2,
                                    py: isMobile ? .5 : 1,
                                    color: item.label === "Logout" ? "#E53935" : "#333",
                                    background: "#f7f7f7",
                                    "&:hover": {
                                        background: "#ececec",
                                    },
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Stack>
                )}

                {/* -------------------------- USER ICONS -------------------------- */}
                {!loggedInUser?.isAdmin && (
                    <Stack direction="row" spacing={isMobile ? 1 : 2} alignItems="center">
                        <IconButton component={Link} to="/wishlist" sx={{ color: "#000" }}>
                            <Badge badgeContent={wishlistItems?.length} color="error">
                                <FavoriteBorderIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
                            </Badge>
                        </IconButton>

                        <IconButton onClick={() => navigate("/cart")} sx={{ color: "#000" }}>
                            <Badge badgeContent={cartItems?.length} color="error">
                                <ShoppingCartOutlinedIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
                            </Badge>
                        </IconButton>

                        {/* Avatar */}
                        <Tooltip title="Account">
                            <IconButton onClick={handleOpenUserMenu}>
                                <Avatar
                                    sx={{
                                        width: isMobile ? 30 : 38,
                                        height: isMobile ? 30 : 38,
                                        bgcolor: "#E53935",
                                        fontWeight: 700,
                                        fontSize: isMobile ? "0.8rem" : "1rem"
                                    }}
                                >
                                    {userInfo?.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                            </IconButton>
                        </Tooltip>

                        {/* Dropdown */}
                        <Menu
                            anchorEl={anchorElUser}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                            PaperProps={{
                                elevation: 4,
                                sx: {
                                    mt: 1,
                                    borderRadius: 2,
                                    minWidth: 180,
                                }
                            }}
                        >
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography fontWeight={700}>{userInfo?.name}</Typography>
                                <Typography fontSize="0.75rem" color="text.secondary">
                                    {userInfo?.email}
                                </Typography>
                            </Box>
                            <Divider />

                            {userMenuItems.map((item) => (
                                <MenuItem
                                    key={item.label}
                                    onClick={handleCloseUserMenu}
                                >
                                    <Typography
                                        component={Link}
                                        to={item.to}
                                        sx={{
                                            textDecoration: "none",
                                            color: item.label === "Logout" ? "#E53935" : "#333",
                                            fontWeight: item.label === "Logout" ? 700 : 500,
                                            width: "100%",
                                        }}>
                                        {item.label}
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Stack>
                )}
            </Toolbar>
        </AppBar>
    );
};
