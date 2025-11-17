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

    const brands = useSelector(selectBrands);
    const categories = useSelector(selectCategories);
    const productAddStatus = useSelector(selectProductAddStatus);

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [productImages, setProductImages] = useState([null, null, null, null]);
    const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);
    const [selectedSizes, setSelectedSizes] = useState([]);

    const selectedCategory = watch("category");

    /* ---------------------------------------------------------------------
       AUTO SIZE LOGIC
    --------------------------------------------------------------------- */
    const sizeOptions = {
        clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        footwear: ["6", "7", "8", "9", "10", "11", "12"],
        accessories: ["One Size"],
        default: [],
    };

    // Update the getCategorySizes function in your AddProduct component

    const getCategorySizes = () => {
        if (!selectedCategory) return [];

        const category = categories.find((c) => c._id === selectedCategory);
        if (!category) return [];

        const name = category.name.toLowerCase();

        // Clothing categories: tops, womens-dresses, mens-shirts
        if (name.includes("shirt") || name.includes("dress") || name === "tops")
            return sizeOptions.clothing;

        // Footwear categories: womens-shoes, mens-shoes
        if (name.includes("shoes"))
            return sizeOptions.footwear;

        // Accessories: bags, jewellery, watches, sunglasses
        if (name.includes("bags") || name.includes("jewellery") ||
            name.includes("watches") || name.includes("sunglasses"))
            return sizeOptions.accessories;

        return sizeOptions.default;
    };

    useEffect(() => setSelectedSizes([]), [selectedCategory]);

    /* ---------------------------------------------------------------------
       SUCCESS HANDLING
    --------------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------------
       HELPERS
    --------------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------------
       SUBMIT
    --------------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------------
       UI — MODERN CLEAN VERSION
    --------------------------------------------------------------------- */
    return (
        <Box sx={{ maxWidth: "850px", mx: "auto", mt: 4, p: 2 }}>
            {/* BACK BUTTON */}
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
                        Add New Product
                    </Typography>

                    {/* FORM */}
                    <form onSubmit={handleSubmit(handleAddProduct)} noValidate>
                        <Grid container spacing={3}>
                            {/* TITLE */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Product Title *"
                                    fullWidth
                                    {...register("title", { required: true })}
                                />
                            </Grid>

                            {/* BRAND */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
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

                            {/* CATEGORY */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Category *</InputLabel>
                                    <Select
                                        label="Category"
                                        {...register("category", { required: true })}
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
                                    label="Description *"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    {...register("description", { required: true })}
                                />
                            </Grid>

                            {/* PRICE */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Price (₹) *"
                                    type="number"
                                    fullWidth
                                    {...register("price", { required: true })}
                                />
                            </Grid>

                            {/* STOCK */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Stock Quantity *"
                                    type="number"
                                    fullWidth
                                    {...register("stockQuantity", { required: true })}
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
                                                variant={
                                                    selectedSizes.includes(size) ? "filled" : "outlined"
                                                }
                                                icon={
                                                    selectedSizes.includes(size) ? (
                                                        <CheckCircleIcon />
                                                    ) : undefined
                                                }
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
                                    Thumbnail Image *
                                </Typography>

                                <Stack direction="row" gap={2} alignItems="center">
                                    <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                                        Upload Thumbnail
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
                                                onClick={handleRemoveThumbnail}
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

                            {/* IMAGES */}
                            <Grid item xs={12}>
                                <Typography fontWeight={600} mb={1}>
                                    Additional Images *
                                </Typography>

                                <Grid container spacing={2}>
                                    {[0, 1, 2, 3].map((index) => (
                                        <Grid item xs={12} sm={6} key={index}>
                                            <Stack direction="row" gap={2} alignItems="center">
                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    startIcon={<AddPhotoAlternateIcon />}
                                                >
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
                                                            onClick={() => handleRemoveProductImage(index)}
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
                                    ))}
                                </Grid>
                            </Grid>

                            {/* SUBMIT BUTTON */}
                            <Grid item xs={12}>
                                <Stack direction="row" justifyContent="flex-end" gap={2}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        component={Link}
                                        to="/admin/dashboard"
                                    >
                                        Cancel
                                    </Button>

                                    <Button type="submit" variant="contained">
                                        Add Product
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};
