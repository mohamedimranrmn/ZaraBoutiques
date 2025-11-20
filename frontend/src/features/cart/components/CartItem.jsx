import React, { useState } from "react";
import {
    IconButton,
    Stack,
    Typography,
    Checkbox,
    Box,
    Card,
    CardContent,
    alpha,
    useTheme,
    useMediaQuery,
    Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useDispatch } from "react-redux";
import { deleteCartItemByIdAsync, updateCartItemByIdAsync } from "../CartSlice";
import { useNavigate } from "react-router-dom";
import { OutOfStockDialog } from "../../../dialogs/OutOfStockDialog";

export const CartItem = ({
                             _id,
                             product,
                             quantity,
                             size = null,
                             selectable = true,
                             checked = false,
                             onSelectChange = () => { }
                         }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.down("md"));
    const [dialogOpen, setDialogOpen] = useState(false);
    /** If product is deleted (null), show a minimal safe card */
    if (!product) {
        return (
            <Card
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "error.main",
                    bgcolor: "#fff6f6",
                    p: 2,
                    borderRadius: 2,
                    mb: 2
                }}
            >
                <Typography fontWeight={600} color="error.main">
                    This product is no longer available.
                </Typography>

                <IconButton
                    onClick={() => dispatch(deleteCartItemByIdAsync(_id))}
                    sx={{
                        mt: 1,
                        color: "error.main",
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                        "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.15)
                        }
                    }}
                >
                    <DeleteOutlineIcon />
                </IconButton>
            </Card>
        );
    }

    /** Safe destructure */
    const {
        _id: productId,
        thumbnail,
        title,
        price,
        stockQuantity
    } = product;

    const handleAddQty = (e) => {
        e.stopPropagation();
        if (quantity >= stockQuantity) {
            setDialogOpen(true);
            return;
        }
        dispatch(updateCartItemByIdAsync({ _id, quantity: quantity + 1 }));
    };

    const handleRemoveQty = (e) => {
        e.stopPropagation();
        if (quantity === 1) {
            dispatch(deleteCartItemByIdAsync(_id));
        } else {
            dispatch(updateCartItemByIdAsync({ _id, quantity: quantity - 1 }));
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        dispatch(deleteCartItemByIdAsync(_id));
    };

    const handleImageClick = (e) => {
        e.stopPropagation();
        navigate(`/product-details/${productId}`);
    };

    return (
        <>
            <Card
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: checked ? "primary.main" : "divider",
                    bgcolor: checked ? alpha(theme.palette.primary.main, 0.05) : "white",
                    transition: "all 0.2s ease",
                    cursor: selectable && !isMobile ? "pointer" : "default",
                    borderRadius: { xs: 2, md: 2.5 },
                    "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: theme.shadows[2]
                    }
                }}
                onClick={() => {
                    if (!isMobile && selectable) {
                        if (stockQuantity === 0) {
                            setDialogOpen(true);
                            return;
                        }
                        onSelectChange(!checked);
                    }
                }}
            >
                <CardContent
                    sx={{
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } }
                    }}
                >
                    {isMobile ? (
                        /* ----------------------------------- MOBILE ----------------------------------- */
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            {selectable && (
                                <Checkbox
                                    checked={checked}
                                    size="small"
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        if (stockQuantity === 0) {
                                            setDialogOpen(true);
                                            return;
                                        }
                                        onSelectChange(e.target.checked);
                                    }}
                                    sx={{ p: 0, alignSelf: "center" }}
                                />
                            )}

                            {/* Image */}
                            <Box
                                onClick={handleImageClick}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    flexShrink: 0,
                                    borderRadius: 1.5,
                                    overflow: "hidden",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: alpha(theme.palette.grey[100], 0.4),
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    "&:hover": {
                                        transform: "scale(1.02)"
                                    }
                                }}
                            >
                                <img
                                    src={thumbnail}
                                    alt={title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        padding: 8
                                    }}
                                />
                            </Box>

                            <Stack flex={1} spacing={0.75} minWidth={0} justifyContent="space-between">
                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    onClick={handleImageClick}
                                    sx={{
                                        cursor: "pointer",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        lineHeight: 1.3,
                                        "&:hover": { color: "primary.main" }
                                    }}
                                >
                                    {title}
                                </Typography>

                                {size && (
                                    <Chip
                                        label={`Size: ${size}`}
                                        size="small"
                                        sx={{
                                            width: "fit-content",
                                            height: 20,
                                            fontSize: "0.7rem",
                                            fontWeight: 600
                                        }}
                                    />
                                )}

                                {stockQuantity === 0 && (
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            color: "error.main",
                                            px: 0.75,
                                            py: 0.25,
                                            borderRadius: 0.75,
                                            width: "fit-content"
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                                            Out of stock
                                        </Typography>
                                    </Box>
                                )}

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    color="primary.main"
                                    sx={{ fontSize: "1rem" }}
                                >
                                    ₹{price.toFixed(2)}
                                </Typography>

                                {/* Qty + delete */}
                                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: "auto" }}>
                                    <IconButton
                                        onClick={handleDelete}
                                        size="small"
                                        sx={{
                                            color: "error.main",
                                            bgcolor: alpha(theme.palette.error.main, 0.08),
                                            p: 0.5,
                                            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.15) }
                                        }}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                    </IconButton>

                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        sx={{
                                            bgcolor: alpha(theme.palette.grey[200], 0.4),
                                            borderRadius: 1.5,
                                            border: "1px solid",
                                            borderColor: "divider"
                                        }}
                                    >
                                        <IconButton size="small" onClick={handleRemoveQty} sx={{ p: 0.5 }}>
                                            <RemoveIcon sx={{ fontSize: 16 }} />
                                        </IconButton>

                                        <Typography
                                            fontWeight={600}
                                            sx={{
                                                px: 1.25,
                                                minWidth: 28,
                                                textAlign: "center",
                                                fontSize: "0.875rem"
                                            }}
                                        >
                                            {quantity}
                                        </Typography>

                                        <IconButton
                                            size="small"
                                            onClick={handleAddQty}
                                            disabled={quantity >= stockQuantity}
                                            sx={{ p: 0.5 }}
                                        >
                                            <AddIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Stack>
                    ) : (
                        /* ----------------------------------- DESKTOP ----------------------------------- */
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
                            {selectable && (
                                <Checkbox
                                    checked={checked}
                                    size="medium"
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        if (stockQuantity === 0) {
                                            setDialogOpen(true);
                                            return;
                                        }
                                        onSelectChange(e.target.checked);
                                    }}
                                    sx={{ p: 0, alignSelf: "center" }}
                                />
                            )}

                            {/* Image */}
                            <Box
                                onClick={handleImageClick}
                                sx={{
                                    width: { sm: 100, md: 110 },
                                    height: { sm: 100, md: 110 },
                                    flexShrink: 0,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: alpha(theme.palette.grey[100], 0.4),
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    "&:hover": { transform: "scale(1.03)" }
                                }}
                            >
                                <img
                                    src={thumbnail}
                                    alt={title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        padding: 8
                                    }}
                                />
                            </Box>

                            <Stack flex={1} spacing={1} minWidth={0} sx={{ justifyContent: "center" }}>
                                <Typography
                                    variant="body1"
                                    fontWeight={600}
                                    onClick={handleImageClick}
                                    sx={{
                                        cursor: "pointer",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        "&:hover": { color: "primary.main" }
                                    }}
                                >
                                    {title}
                                </Typography>

                                {size && (
                                    <Chip
                                        label={`Size: ${size}`}
                                        size="small"
                                        sx={{
                                            width: "fit-content",
                                            height: 22,
                                            fontSize: "0.75rem",
                                            fontWeight: 600
                                        }}
                                    />
                                )}

                                {stockQuantity === 0 && (
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            color: "error.main",
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            width: "fit-content",
                                            mt: -0.25
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={600}>
                                            Out of stock
                                        </Typography>
                                    </Box>
                                )}

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    color="primary.main"
                                    sx={{ fontSize: "1.25rem" }}
                                >
                                    ₹{price.toFixed(2)}
                                </Typography>

                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing={2}
                                    sx={{ mt: 0.5 }}
                                >
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        sx={{
                                            bgcolor: alpha(theme.palette.grey[200], 0.4),
                                            borderRadius: 1.5,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            py: 0.25,
                                            px: 0.5
                                        }}
                                    >
                                        <IconButton onClick={handleRemoveQty} size={isTablet ? "small" : "medium"}>
                                            <RemoveIcon sx={{ fontSize: { sm: 20, md: 22 } }} />
                                        </IconButton>

                                        <Typography
                                            fontWeight={600}
                                            sx={{
                                                px: 2,
                                                minWidth: 40,
                                                textAlign: "center",
                                                fontSize: "1rem"
                                            }}
                                        >
                                            {quantity}
                                        </Typography>

                                        <IconButton
                                            onClick={handleAddQty}
                                            disabled={quantity >= stockQuantity}
                                            size={isTablet ? "small" : "medium"}
                                        >
                                            <AddIcon sx={{ fontSize: { sm: 20, md: 22 } }} />
                                        </IconButton>
                                    </Stack>

                                    <IconButton
                                        onClick={handleDelete}
                                        size={isTablet ? "small" : "medium"}
                                        sx={{
                                            color: "error.main",
                                            bgcolor: alpha(theme.palette.error.main, 0.08),
                                            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.15) }
                                        }}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: { sm: 20, md: 24 } }} />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <OutOfStockDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                message="This product is out of stock. Would you like to remove it from your cart?"
                showRemoveButton={true}
                onRemove={() => {
                    dispatch(deleteCartItemByIdAsync(_id));
                    setDialogOpen(false);
                }}
            />
        </>
    );
};
