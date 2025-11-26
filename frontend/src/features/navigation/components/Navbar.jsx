import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import { selectCartItems } from '../../cart/CartSlice';

export const Navbar = () => {
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [localSearch, setLocalSearch] = React.useState(searchParams.get('search') || '');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const navigate = useNavigate();
    const loggedInUser = useSelector(selectLoggedInUser);
    const userInfo = useSelector(selectUserInfo);
    const wishlistItems = useSelector(selectWishlistItems);
    const cartItems = useSelector(selectCartItems);

    /* --- Debounce Search Query --- */
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (localSearch.trim()) params.set('search', localSearch.trim());
            else params.delete('search');
            params.delete('page');
            setSearchParams(params);
        }, 300);

        return () => clearTimeout(timer);
    }, [localSearch]);

    const handleClearSearch = () => {
        setLocalSearch("");
        const params = new URLSearchParams(searchParams);
        params.delete("search");
        params.delete("page");
        setSearchParams(params);
    };

    /* -------------------------- DROPDOWN -------------------------- */
    const userMenuItems = [
        { label: "Home", to: "/" },
        { label: "Profile", to: "/profile" },
        { label: "My Orders", to: "/orders" },
        { label: "Logout", to: "/logout" }
    ];

    return (
        <AppBar
            position="sticky"
            sx={{
                background: "#ffffff",
                color: "#000",
                borderBottom: "1px solid #e5e5e5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
        >
            <Toolbar
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    px: isMobile ? 1.5 : 4,
                    minHeight: isMobile ? 58 : 72,
                    gap: 2,
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
                        color: "#000",
                        letterSpacing: ".03rem",
                        whiteSpace: "nowrap",
                    }}
                >
                    ZARA BOUTIQUES
                </Typography>

                {/* -------------------------- SEARCH DESKTOP -------------------------- */}
                {!isMobile && !loggedInUser?.isAdmin && (
                    <Box sx={{ flexGrow: 1, px: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search products..."
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
                                        <IconButton onClick={handleClearSearch} size="small">
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    background: "#f5f5f5",
                                    "& fieldset": {
                                        borderColor: "#ddd",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "#c5c5c5",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#000",
                                    },
                                },
                            }}
                        />
                    </Box>
                )}

                {/* -------------------------- ADMIN BUTTONS -------------------------- */}
                {loggedInUser?.isAdmin && (
                    <Stack
                        direction="row"
                        spacing={isMobile ? 1 : 2}
                        alignItems="center"
                        sx={{ flexShrink: 0 }}
                    >
                        {isMobile ? (
                            <>
                                <Typography
                                    sx={{
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        color: "#333"
                                    }}
                                >
                                    Admin Panel
                                </Typography>
                                <Button
                                    component={Link}
                                    to="/logout"
                                    sx={{
                                        textTransform: "none",
                                        fontSize: ".75rem",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 2,
                                        py: 0.6,
                                        minWidth: 'auto',
                                        color: "#d32f2f",
                                        background: "#f5f5f5",
                                        "&:hover": { background: "#e9e9e9" }
                                    }}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    component={Link}
                                    to="/admin/dashboard"
                                    sx={{
                                        textTransform: "none",
                                        fontSize: ".9rem",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1,
                                        color: "#333",
                                        background: "#f5f5f5",
                                        "&:hover": { background: "#e9e9e9" }
                                    }}
                                >
                                    Dashboard
                                </Button>

                                <Button
                                    component={Link}
                                    to="/admin/orders"
                                    sx={{
                                        textTransform: "none",
                                        fontSize: ".9rem",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1,
                                        color: "#333",
                                        background: "#f5f5f5",
                                        "&:hover": { background: "#e9e9e9" }
                                    }}
                                >
                                    Orders
                                </Button>

                                <Button
                                    component={Link}
                                    to="/logout"
                                    sx={{
                                        textTransform: "none",
                                        fontSize: ".9rem",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1,
                                        color: "#d32f2f",
                                        background: "#f5f5f5",
                                        "&:hover": { background: "#e9e9e9" }
                                    }}
                                >
                                    Logout
                                </Button>
                            </>
                        )}
                    </Stack>
                )}

                {/* -------------------------- RIGHT SIDE ICONS -------------------------- */}
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
                            <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)}>
                                <Avatar
                                    sx={{
                                        width: isMobile ? 30 : 36,
                                        height: isMobile ? 30 : 36,
                                        fontWeight: 700,
                                        fontSize: isMobile ? "0.75rem" : "0.9rem",
                                        bgcolor: "#000",
                                        color: "#fff",
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
                            onClose={() => setAnchorElUser(null)}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    mt: 1.5,
                                    borderRadius: 2,
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                                },
                            }}
                        >
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography fontWeight={700}>{userInfo?.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {userInfo?.email}
                                </Typography>
                            </Box>
                            <Divider />

                            {userMenuItems.map((item) => (
                                <MenuItem key={item.label} onClick={() => setAnchorElUser(null)}>
                                    <Typography
                                        component={Link}
                                        to={item.to}
                                        sx={{
                                            textDecoration: "none",
                                            width: "100%",
                                            color: item.label === "Logout" ? "red" : "inherit",
                                            fontWeight: item.label === "Logout" ? 600 : 500,
                                        }}
                                    >
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
