import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    clearSelectedProduct,
    fetchProductByIdAsync,
    resetProductUpdateStatus,
    selectProductUpdateStatus,
    selectSelectedProduct,
    updateProductByIdAsync,
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
} from "@mui/material";

import { useForm } from "react-hook-form";
import { selectBrands } from "../../brands/BrandSlice";
import { selectCategories } from "../../categories/CategoriesSlice";
import { toast } from "react-toastify";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const AVAILABLE_SIZES = {
    clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    footwear: ["6", "7", "8", "9", "10", "11", "12"],
    accessories: ["One Size"],
    default: []
};

export const ProductUpdate = () => {
    const { register, handleSubmit, watch } = useForm();
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const selectedProduct = useSelector(selectSelectedProduct);
    const productUpdateStatus = useSelector(selectProductUpdateStatus);
    const brands = useSelector(selectBrands);
    const categories = useSelector(selectCategories);

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [productImages, setProductImages] = useState([null, null, null, null]);
    const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);
    const [selectedSizes, setSelectedSizes] = useState([]);

    const selectedCategoryId = watch("category");

    /* ------------------------------------------------------------
       SIZE LOGIC
    ------------------------------------------------------------ */
    const getCategorySizes = () => {
        if (!selectedCategoryId) return [];

        const category = categories.find(c => c._id === selectedCategoryId);
        if (!category) return [];

        const name = category.name.toLowerCase();

        // Clothing categories
        if (name.includes("shirt") || name.includes("dress") || name === "tops")
            return AVAILABLE_SIZES.clothing;

        // Footwear categories
        if (name.includes("shoes"))
            return AVAILABLE_SIZES.footwear;

        // Accessories categories
        if (name.includes("bags") || name.includes("jewellery") ||
            name.includes("watches") || name.includes("sunglasses"))
            return AVAILABLE_SIZES.accessories;

        return AVAILABLE_SIZES.default;
    };

    const availableSizes = getCategorySizes();

    const toggleSize = (size) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    /* ------------------------------------------------------------
       FETCH PRODUCT
    ------------------------------------------------------------ */
    useEffect(() => {
        if (id) dispatch(fetchProductByIdAsync(id));
    }, [id]);

    useEffect(() => {
        if (selectedProduct) {
            setThumbnail(selectedProduct.thumbnail);
            setThumbnailPreview(selectedProduct.thumbnail);

            const imgs = [...selectedProduct.images];
            while (imgs.length < 4) imgs.push(null);

            setProductImages(imgs);
            setImagePreviews(imgs);

            // Load existing sizes
            if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
                setSelectedSizes(selectedProduct.sizes);
            }
        }
    }, [selectedProduct]);

    /* ------------------------------------------------------------
       UPDATE SUCCESS HANDLING
    ------------------------------------------------------------ */
    useEffect(() => {
        if (productUpdateStatus === "fulfilled") {
            toast.success("Product updated successfully");
            navigate("/admin/dashboard");
        } else if (productUpdateStatus === "rejected") {
            toast.error("Error updating product");
        }
    }, [productUpdateStatus]);

    useEffect(() => {
        return () => {
            dispatch(clearSelectedProduct());
            dispatch(resetProductUpdateStatus());
        };
    }, []);

    /* ------------------------------------------------------------
       HELPERS
    ------------------------------------------------------------ */
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
        if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB allowed");

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

    const handleSubmitUpdate = (data) => {
        if (!thumbnail) return toast.error("Thumbnail required");

        const images = productImages.filter((i) => i !== null);
        if (images.length === 0) return toast.error("Upload at least one product image");

        // Validate sizes if category requires them
        if (availableSizes.length > 0 && selectedSizes.length === 0) {
            return toast.error("Please select at least one size");
        }

        dispatch(
            updateProductByIdAsync({
                ...data,
                _id: selectedProduct._id,
                thumbnail,
                images,
                sizes: selectedSizes.length ? selectedSizes : undefined,
            })
        );
    };

    if (!selectedProduct) return null;

    return (
        <Box sx={{ maxWidth: "850px", mx: "auto", mt: 4, p: 2 }}>
            <IconButton
                component={Link}
                to="/admin/dashboard"
                sx={{
                    mb: 2,
                    bgcolor: "grey.100",
                    "&:hover": { bgcolor: "grey.200" },
                }}
            >
                <ArrowBackIcon />
            </IconButton>

            <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent>
                    <Typography variant="h5" fontWeight={600} mb={3}>
                        Update Product
                    </Typography>

                    <Grid
                        container
                        spacing={3}
                        component="form"
                        onSubmit={handleSubmit(handleSubmitUpdate)}
                    >
                        {/* TITLE */}
                        <Grid item xs={12}>
                            <TextField
                                label="Product Title"
                                fullWidth
                                defaultValue={selectedProduct.title}
                                {...register("title")}
                            />
                        </Grid>

                        {/* BRAND + CATEGORY */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Brand</InputLabel>
                                <Select
                                    label="Brand"
                                    defaultValue={selectedProduct.brand._id}
                                    {...register("brand")}
                                >
                                    {brands.map((b) => (
                                        <MenuItem key={b._id} value={b._id}>
                                            {b.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    label="Category"
                                    defaultValue={selectedProduct.category._id}
                                    {...register("category")}
                                >
                                    {categories.map((c) => (
                                        <MenuItem key={c._id} value={c._id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* DESCRIPTION */}
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={4}
                                defaultValue={selectedProduct.description}
                                {...register("description")}
                            />
                        </Grid>

                        {/* PRICE */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Price (₹)"
                                type="number"
                                fullWidth
                                defaultValue={selectedProduct.price}
                                {...register("price")}
                            />
                        </Grid>

                        {/* STOCK */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Stock Quantity"
                                type="number"
                                fullWidth
                                defaultValue={selectedProduct.stockQuantity}
                                {...register("stockQuantity")}
                            />
                        </Grid>

                        {/* SIZES */}
                        {availableSizes.length > 0 && (
                            <Grid item xs={12}>
                                <Typography fontWeight={600} mb={1}>
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
                                                borderRadius: 1.5,
                                                px: 1,
                                                cursor: "pointer",
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Grid>
                        )}

                        {/* THUMBNAIL */}
                        <Grid item xs={12}>
                            <Typography fontWeight={600} mb={1}>
                                Thumbnail Image
                            </Typography>

                            <Stack direction="row" alignItems="center" gap={2}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<PhotoCamera />}
                                >
                                    Change Thumbnail
                                    <input hidden type="file" accept="image/*" onChange={handleThumbnailChange} />
                                </Button>

                                {thumbnailPreview && (
                                    <Box position="relative">
                                        <img
                                            src={thumbnailPreview}
                                            style={{
                                                width: 90,
                                                height: 90,
                                                borderRadius: 8,
                                                objectFit: "cover",
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => setThumbnailPreview(null)}
                                            sx={{
                                                position: "absolute",
                                                top: -10,
                                                right: -10,
                                                bgcolor: "white",
                                            }}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}
                            </Stack>
                        </Grid>

                        {/* PRODUCT IMAGES */}
                        <Grid item xs={12}>
                            <Typography fontWeight={600} mb={1}>
                                Product Images
                            </Typography>

                            <Grid container spacing={2}>
                                {[0, 1, 2, 3].map((index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                        <Stack direction="row" gap={2} alignItems="center">
                                            <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                                                Upload {index + 1}
                                                <input
                                                    hidden
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleProductImageChange(e, index)}
                                                />
                                            </Button>

                                            {imagePreviews[index] && (
                                                <Box position="relative">
                                                    <img
                                                        src={imagePreviews[index]}
                                                        style={{
                                                            width: 90,
                                                            height: 90,
                                                            borderRadius: 8,
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            position: "absolute",
                                                            top: -10,
                                                            right: -10,
                                                            bgcolor: "white",
                                                        }}
                                                        onClick={() => {
                                                            const prev = [...imagePreviews];
                                                            const imgs = [...productImages];
                                                            prev[index] = null;
                                                            imgs[index] = null;
                                                            setImagePreviews(prev);
                                                            setProductImages(imgs);
                                                        }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>

                        {/* ACTION BUTTONS */}
                        <Grid item xs={12}>
                            <Stack direction="row" justifyContent="flex-end" gap={2}>
                                <Button type="submit" variant="contained">
                                    Update
                                </Button>
                                <Button component={Link} to="/admin/dashboard" variant="outlined" color="error">
                                    Cancel
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};