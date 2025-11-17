import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Chip, Stack, useMediaQuery, useTheme, Box, Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { selectCartItems } from '../../cart/CartSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

export const Navbar = () => {

    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const userInfo = useSelector(selectUserInfo);
    const cartItems = useSelector(selectCartItems);
    const loggedInUser = useSelector(selectLoggedInUser);
    const wishlistItems = useSelector(selectWishlistItems);

    const navigate = useNavigate();
    const theme = useTheme();
    const is600 = useMediaQuery(theme.breakpoints.down(600));
    const is480 = useMediaQuery(theme.breakpoints.down(480));

    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const settings = [
        { name: "Home", to: "/" },
        { name: 'Profile', to: loggedInUser?.isAdmin ? "/admin/profile" : "/profile" },
        { name: loggedInUser?.isAdmin ? 'Orders' : 'My Orders', to: loggedInUser?.isAdmin ? "/admin/orders" : "/orders" },
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
                    height: is600 ? 60 : 70,
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
                    }}
                >
                    ZARA BOUTIQUES
                </Typography>

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