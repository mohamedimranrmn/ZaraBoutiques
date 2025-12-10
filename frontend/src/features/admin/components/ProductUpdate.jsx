// frontend/src/features/ProductUpdate.jsx

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
    CircularProgress,
    LinearProgress,
} from "@mui/material";

import { useForm } from "react-hook-form";
import { selectBrands } from "../../brands/BrandSlice";
import { selectCategories } from "../../categories/CategoriesSlice";
import { toast } from "react-toastify";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { uploadToImageKit } from "../../../utils/uploadFile";

const AVAILABLE_SIZES = {
    clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    footwear: ["6", "7", "8", "9", "10", "11", "12"],
    accessories: ["One Size"],
    default: [],
};

export const ProductUpdate = () => {
    const { register, handleSubmit } = useForm();
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const selectedProduct = useSelector(selectSelectedProduct);
    const productUpdateStatus = useSelector(selectProductUpdateStatus);
    const brands = useSelector(selectBrands);
    const categories = useSelector(selectCategories);

    // Thumbnail (can be URL string or File)
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    // Product images (URL or File)
    const [productImages, setProductImages] = useState([null, null, null, null]);
    const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);

    const [selectedSizes, setSelectedSizes] = useState([]);

    // Loader
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (id) dispatch(fetchProductByIdAsync(id));
    }, [id]);

    useEffect(() => {
        if (selectedProduct) {
            setThumbnail(selectedProduct.thumbnail || null);
            setThumbnailPreview(selectedProduct.thumbnail || null);

            const imgs = [...(selectedProduct.images || [])];
            while (imgs.length < 4) imgs.push(null);

            setProductImages(imgs);
            setImagePreviews(imgs);

            setSelectedSizes(selectedProduct.sizes || []);
        }
    }, [selectedProduct]);

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

    const getCategorySizes = (catId) => {
        if (!catId) return [];
        const category = categories.find((c) => c._id === catId);
        if (!category) return [];

        const name = category.name.toLowerCase();

        if (name.includes("shirt") || name.includes("dress") || name === "tops")
            return AVAILABLE_SIZES.clothing;

        if (name.includes("shoes")) return AVAILABLE_SIZES.footwear;

        if (
            name.includes("bags") ||
            name.includes("jewellery") ||
            name.includes("watches") ||
            name.includes("sunglasses")
        )
            return AVAILABLE_SIZES.accessories;

        return AVAILABLE_SIZES.default;
    };

    const toggleSize = (size) => {
        setSelectedSizes((prev) =>
            prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
        );
    };

    // Handlers
    const handleThumbnailChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnail(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handleProductImageChange = (e, index) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const imgs = [...productImages];
        const prevs = [...imagePreviews];

        imgs[index] = file;
        prevs[index] = URL.createObjectURL(file);

        setProductImages(imgs);
        setImagePreviews(prevs);
    };

    const removeImageAtIndex = (index) => {
        const imgs = [...productImages];
        const prevs = [...imagePreviews];

        imgs[index] = null;
        prevs[index] = null;

        setProductImages(imgs);
        setImagePreviews(prevs);
    };

    // ImageKit upload wrapper
    const uploadImageKitFile = async (file) => {
        const url = await uploadToImageKit(file);
        return url;
    };

    const handleSubmitUpdate = async (formData) => {
        if (!selectedProduct) return;

        try {
            const availableSizes = getCategorySizes(
                formData.category || selectedProduct.category._id
            );

            if (availableSizes.length > 0 && selectedSizes.length === 0)
                return toast.error("Please select at least one size");

            setUploading(true);
            setUploadProgress(10);

            // Upload only NEW files
            let finalThumbnail = thumbnail;
            let finalImages = [];

            if (thumbnail instanceof File) {
                finalThumbnail = await uploadImageKitFile(thumbnail);
            }

            for (const img of productImages) {
                if (img === null) continue;

                if (img instanceof File) {
                    const uploaded = await uploadImageKitFile(img);
                    finalImages.push(uploaded);
                } else if (typeof img === "string") {
                    finalImages.push(img);
                }
            }

            setUploadProgress(80);

            const payload = {
                ...formData,
                _id: selectedProduct._id,
                thumbnail: finalThumbnail,
                images: finalImages,
                sizes: selectedSizes,
                discountPercentage: formData.discountPercentage
                    ? Number(formData.discountPercentage)
                    : selectedProduct.discountPercentage ?? 0,
            };

            dispatch(updateProductByIdAsync(payload));

            setUploadProgress(100);
            setUploading(false);
        } catch (err) {
            console.error("Update error:", err);
            setUploading(false);
            toast.error("Update failed. Try again.");
        }
    };

    if (!selectedProduct) return null;

    const availableSizes = getCategorySizes(selectedProduct.category._id);

    return (
        <Box sx={{ maxWidth: "850px", mx: "auto", mt: 4, p: 2 }}>
            <IconButton
                component={Link}
                to="/admin/dashboard"
                sx={{ mb: 2, bgcolor: "grey.100" }}
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

                        {/* PRICE + DISCOUNT */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Price (₹)"
                                type="number"
                                fullWidth
                                defaultValue={selectedProduct.price}
                                {...register("price")}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Discount %"
                                type="number"
                                fullWidth
                                defaultValue={selectedProduct.discountPercentage ?? 0}
                                {...register("discountPercentage")}
                                helperText="Optional — percentage discount (0–100)"
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
                                            color={
                                                selectedSizes.includes(size) ? "primary" : "default"
                                            }
                                            variant={
                                                selectedSizes.includes(size) ? "filled" : "outlined"
                                            }
                                            icon={
                                                selectedSizes.includes(size) ? (
                                                    <CheckCircleIcon />
                                                ) : undefined
                                            }
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
                                <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                                    Change Thumbnail
                                    <input hidden type="file" accept="image/*" onChange={handleThumbnailChange} />
                                </Button>

                                {thumbnailPreview && (
                                    <Box position="relative">
                                        <img
                                            src={thumbnailPreview}
                                            alt="thumb"
                                            style={{
                                                width: 90,
                                                height: 90,
                                                borderRadius: 8,
                                                objectFit: "cover",
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setThumbnail(null);
                                                setThumbnailPreview(null);
                                            }}
                                            sx={{ position: "absolute", top: -10, right: -10, bgcolor: "white" }}
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
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                startIcon={<PhotoCamera />}
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
                                                        alt={`img-${index}`}
                                                        style={{
                                                            width: 90,
                                                            height: 90,
                                                            borderRadius: 8,
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        sx={{ position: "absolute", top: -10, right: -10, bgcolor: "white" }}
                                                        onClick={() => removeImageAtIndex(index)}
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

                        {/* ACTIONS */}
                        <Grid item xs={12}>
                            <Stack direction="row" justifyContent="flex-end" gap={2}>
                                <Box sx={{ position: "relative" }}>
                                    <Button type="submit" variant="contained" disabled={uploading}>
                                        {uploading ? "Uploading..." : "Update"}
                                    </Button>

                                    {uploading && (
                                        <Box sx={{ width: 240, mt: 1 }}>
                                            <LinearProgress variant="determinate" value={uploadProgress} />
                                            <Typography variant="caption">{uploadProgress}%</Typography>
                                        </Box>
                                    )}
                                </Box>

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

export default ProductUpdate;
