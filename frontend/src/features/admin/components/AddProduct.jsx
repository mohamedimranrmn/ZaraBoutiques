import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
    addProductAsync,
    resetProductAddStatus,
    selectProductAddStatus,
} from "../../products/ProductSlice";

import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    IconButton,
    Chip,
    Paper,
    Divider,
    useMediaQuery,
    useTheme,
    Fab,
} from "@mui/material";

import { useForm, Controller } from "react-hook-form";
import { selectBrands } from "../../brands/BrandSlice";
import { selectCategories } from "../../categories/CategoriesSlice";
import { toast } from "react-toastify";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import ClearIcon from "@mui/icons-material/Clear";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import HomeIcon from '@mui/icons-material/Home';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';

export const AddProduct = () => {
    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors },
    } = useForm();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const brands = useSelector(selectBrands);
    const categories = useSelector(selectCategories);
    const productAddStatus = useSelector(selectProductAddStatus);

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [productImages, setProductImages] = useState([null, null, null, null]);
    const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);
    const [selectedSizes, setSelectedSizes] = useState([]);

    const selectedCategory = watch("category");

    const sizeOptions = {
        clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        footwear: ["6", "7", "8", "9", "10", "11", "12"],
        accessories: ["One Size"],
        default: [],
    };

    const getCategorySizes = () => {
        if (!selectedCategory) return [];

        const category = categories.find((c) => c._id === selectedCategory);
        if (!category) return [];

        const name = category.name.toLowerCase();

        if (name.includes("shirt") || name.includes("dress") || name === "tops")
            return sizeOptions.clothing;

        if (name.includes("shoes"))
            return sizeOptions.footwear;

        if (name.includes("bags") || name.includes("jewellery") ||
            name.includes("watches") || name.includes("sunglasses"))
            return sizeOptions.accessories;

        return sizeOptions.default;
    };

    useEffect(() => setSelectedSizes([]), [selectedCategory]);

    useEffect(() => {
        if (productAddStatus === "fulfilled") {
            toast.success("Product added successfully");
            navigate("/admin/dashboard");
        } else if (productAddStatus === "rejected") {
            toast.error("Error adding product");
        }
    }, [productAddStatus]);

    useEffect(() => {
        return () => dispatch(resetProductAddStatus());
    }, []);

    const convertToBase64 = (file) =>
        new Promise((res, rej) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
        });

    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const base64 = await convertToBase64(file);
        setThumbnail(base64);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handleProductImageChange = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        const base64 = await convertToBase64(file);

        const imgs = [...productImages];
        imgs[index] = base64;
        setProductImages(imgs);

        const prevs = [...imagePreviews];
        prevs[index] = URL.createObjectURL(file);
        setImagePreviews(prevs);
    };

    const handleRemoveProductImage = (index) => {
        const imgs = [...productImages];
        const prevs = [...imagePreviews];
        imgs[index] = null;
        prevs[index] = null;
        setProductImages(imgs);
        setImagePreviews(prevs);
    };

    const handleRemoveThumbnail = () => {
        setThumbnail(null);
        setThumbnailPreview(null);
    };

    const toggleSize = (size) => {
        setSelectedSizes((prev) =>
            prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
        );
    };

    const handleAddProduct = (data) => {
        if (!thumbnail) return toast.error("Thumbnail is required");

        const validImages = productImages.filter((i) => i !== null);
        if (validImages.length === 0)
            return toast.error("Upload at least one product image");

        const sizes = getCategorySizes();
        if (sizes.length > 0 && selectedSizes.length === 0)
            return toast.error("Select at least one size");

        const newProduct = {
            ...data,
            thumbnail,
            images: validImages,
            sizes: selectedSizes.length ? selectedSizes : undefined,
        };

        dispatch(addProductAsync(newProduct));
    };

    const availableSizes = getCategorySizes();

    return (
        <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pb: isMobile ? 12 : 4 }}>
            {/* Header */}
            <Box
                sx={{
                    bgcolor: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    py: 2.5,
                    px: { xs: 2, sm: 3, md: 4 },
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ maxWidth: '1200px', mx: 'auto' }}>
                    <IconButton
                        component={Link}
                        to="/admin/dashboard"
                        sx={{
                            bgcolor: 'grey.100',
                            '&:hover': { bgcolor: 'grey.200' },
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>
                            Add New Product
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Fill in the product details below
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Content */}
            <Box sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 2, sm: 3, md: 4 }, mt: 3 }}>
                <form onSubmit={handleSubmit(handleAddProduct)} noValidate>
                    <Grid container spacing={3}>
                        {/* Basic Information Card */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Typography variant="h6" fontWeight={600} mb={3}>
                                        Basic Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Product Title *"
                                                fullWidth
                                                {...register("title", { required: true })}
                                                error={!!errors.title}
                                                helperText={errors.title && "Title is required"}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth error={!!errors.brand}>
                                                <InputLabel>Brand *</InputLabel>
                                                <Select label="Brand" {...register("brand", { required: true })}>
                                                    {brands.map((b) => (
                                                        <MenuItem key={b._id} value={b._id}>
                                                            {b.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth error={!!errors.category}>
                                                <InputLabel>Category *</InputLabel>
                                                <Select label="Category" {...register("category", { required: true })}>
                                                    {categories.map((c) => (
                                                        <MenuItem key={c._id} value={c._id}>
                                                            {c.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                label="Description *"
                                                fullWidth
                                                multiline
                                                rows={4}
                                                {...register("description", { required: true })}
                                                error={!!errors.description}
                                                helperText={errors.description && "Description is required"}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Pricing & Stock Card */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Typography variant="h6" fontWeight={600} mb={3}>
                                        Pricing & Stock
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Price (₹) *"
                                                type="number"
                                                fullWidth
                                                {...register("price", { required: true, min: 0 })}
                                                error={!!errors.price}
                                                helperText={errors.price && "Valid price is required"}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Stock Quantity *"
                                                type="number"
                                                fullWidth
                                                {...register("stockQuantity", { required: true, min: 0 })}
                                                error={!!errors.stockQuantity}
                                                helperText={errors.stockQuantity && "Valid stock quantity is required"}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Sizes Card */}
                        {availableSizes.length > 0 && (
                            <Grid item xs={12}>
                                <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Typography variant="h6" fontWeight={600} mb={2}>
                                            Available Sizes *
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={1.5}>
                                            {availableSizes.map((size) => (
                                                <Chip
                                                    key={size}
                                                    label={size}
                                                    onClick={() => toggleSize(size)}
                                                    color={selectedSizes.includes(size) ? "primary" : "default"}
                                                    variant={selectedSizes.includes(size) ? "filled" : "outlined"}
                                                    icon={selectedSizes.includes(size) ? <CheckCircleIcon /> : undefined}
                                                    sx={{
                                                        borderRadius: 2,
                                                        px: 2,
                                                        py: 2.5,
                                                        cursor: "pointer",
                                                        fontWeight: 500,
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {/* Images Card */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Typography variant="h6" fontWeight={600} mb={3}>
                                        Product Images
                                    </Typography>

                                    {/* Thumbnail */}
                                    <Box mb={3}>
                                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                            Thumbnail Image *
                                        </Typography>
                                        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                startIcon={<PhotoCamera />}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {thumbnailPreview ? "Change" : "Upload"} Thumbnail
                                                <input hidden type="file" accept="image/*" onChange={handleThumbnailChange} />
                                            </Button>

                                            {thumbnailPreview && (
                                                <Paper elevation={0} sx={{ position: 'relative', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
                                                    <img
                                                        src={thumbnailPreview}
                                                        style={{
                                                            width: 100,
                                                            height: 100,
                                                            borderRadius: 8,
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleRemoveThumbnail}
                                                        sx={{
                                                            position: "absolute",
                                                            top: -8,
                                                            right: -8,
                                                            bgcolor: "error.main",
                                                            color: "white",
                                                            '&:hover': { bgcolor: 'error.dark' }
                                                        }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </Paper>
                                            )}
                                        </Stack>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* Additional Images */}
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                            Additional Images * (Upload at least 1)
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {[0, 1, 2, 3].map((index) => (
                                                <Grid item xs={6} sm={3} key={index}>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            border: '2px dashed',
                                                            borderColor: imagePreviews[index] ? 'primary.main' : 'grey.300',
                                                            borderRadius: 2,
                                                            p: 2,
                                                            textAlign: 'center',
                                                            position: 'relative',
                                                            bgcolor: imagePreviews[index] ? 'transparent' : 'grey.50'
                                                        }}
                                                    >
                                                        {imagePreviews[index] ? (
                                                            <>
                                                                <img
                                                                    src={imagePreviews[index]}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: 120,
                                                                        borderRadius: 8,
                                                                        objectFit: "cover",
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleRemoveProductImage(index)}
                                                                    sx={{
                                                                        position: "absolute",
                                                                        top: 8,
                                                                        right: 8,
                                                                        bgcolor: "error.main",
                                                                        color: "white",
                                                                        '&:hover': { bgcolor: 'error.dark' }
                                                                    }}
                                                                >
                                                                    <ClearIcon fontSize="small" />
                                                                </IconButton>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                component="label"
                                                                fullWidth
                                                                sx={{
                                                                    height: 120,
                                                                    flexDirection: 'column',
                                                                    gap: 1
                                                                }}
                                                            >
                                                                <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Image {index + 1}
                                                                </Typography>
                                                                <input
                                                                    hidden
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleProductImageChange(e, index)}
                                                                />
                                                            </Button>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Action Buttons - Desktop Only */}
                        {!isMobile && (
                            <Grid item xs={12}>
                                <Stack direction="row" justifyContent="flex-end" gap={2}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        component={Link}
                                        to="/admin/dashboard"
                                        sx={{ borderRadius: 2, px: 4 }}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        startIcon={<SaveIcon />}
                                        sx={{ borderRadius: 2, px: 4 }}
                                    >
                                        Save Product
                                    </Button>
                                </Stack>
                            </Grid>
                        )}
                    </Grid>
                </form>
            </Box>

            {/* Mobile Bottom Navigation Bar */}
            {isMobile && (
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        pointerEvents: "none",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            width: "100%",
                            height: 56,
                            bgcolor: "rgba(255, 255, 255, 0.7)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            boxShadow: "0 -1px 20px rgba(0,0,0,0.08)",
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                position: "absolute",
                                top: -28,
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: 75,
                                height: 75,
                                bgcolor: "rgba(255, 255, 255, 0.7)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                borderRadius: "50%",
                                boxShadow: "0 -2px 15px rgba(0,0,0,0.08)",
                            }}
                        />
                    </Box>

                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            width: "100%",
                            height: 56,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-around",
                            px: 3,
                            pointerEvents: "auto",
                        }}
                    >
                        <IconButton
                            component={Link}
                            to="/admin/dashboard"
                            sx={{
                                color: "#666",
                                "&:hover": {
                                    color: "#000",
                                    bgcolor: "rgba(0,0,0,0.05)",
                                },
                            }}
                        >
                            <HomeIcon sx={{ fontSize: 24 }} />
                        </IconButton>

                        <Box sx={{ width: 56 }} />

                        <IconButton
                            component={Link}
                            to="/admin/orders"
                            sx={{
                                color: "#666",
                                "&:hover": {
                                    color: "#000",
                                    bgcolor: "rgba(0,0,0,0.05)",
                                },
                            }}
                        >
                            <ReceiptLongIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            position: "absolute",
                            left: "50%",
                            bottom: 18,
                            transform: "translateX(-50%)",
                            pointerEvents: "auto",
                        }}
                    >
                        <Fab
                            type="submit"
                            onClick={handleSubmit(handleAddProduct)}
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: "#000000",
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                                "&:hover": {
                                    bgcolor: "#1a1a1a",
                                    transform: "scale(1.08) translateY(-2px)",
                                    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.4)",
                                },
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                        >
                            <SaveIcon sx={{ fontSize: 28, color: "#ffffff" }} />
                        </Fab>
                    </Box>
                </Box>
            )}
        </Box>
    );
};