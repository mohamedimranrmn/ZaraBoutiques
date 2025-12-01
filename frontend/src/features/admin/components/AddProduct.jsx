// frontend/src/features/AddProduct.jsx
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
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { storage } from "../../../firebase/client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export const AddProduct = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const brands = useSelector(selectBrands);
    const categories = useSelector(selectCategories);
    const productAddStatus = useSelector(selectProductAddStatus);

    // Local state for "Option B"
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const [productFiles, setProductFiles] = useState([null, null, null, null]);
    const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);

    const [selectedSizes, setSelectedSizes] = useState([]);

    const selectedCategory = watch("category");

    // Loader state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Size Options
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

        if (name.includes("shoes")) return sizeOptions.footwear;

        if (
            name.includes("bags") ||
            name.includes("jewellery") ||
            name.includes("watches") ||
            name.includes("sunglasses")
        )
            return sizeOptions.accessories;

        return sizeOptions.default;
    };

    const availableSizes = getCategorySizes();

    useEffect(() => {
        setSelectedSizes([]);
    }, [selectedCategory]);

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

    // Thumbnail handler
    const handleThumbnailChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    // Product images
    const handleProductImageChange = (e, index) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const updatedFiles = [...productFiles];
        updatedFiles[index] = file;

        const updatedPreviews = [...imagePreviews];
        updatedPreviews[index] = URL.createObjectURL(file);

        setProductFiles(updatedFiles);
        setImagePreviews(updatedPreviews);
    };

    const handleRemoveThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
    };

    const handleRemoveProductImage = (index) => {
        const updatedFiles = [...productFiles];
        const updatedPreviews = [...imagePreviews];
        updatedFiles[index] = null;
        updatedPreviews[index] = null;
        setProductFiles(updatedFiles);
        setImagePreviews(updatedPreviews);
    };

    const toggleSize = (size) => {
        setSelectedSizes((prev) =>
            prev.includes(size)
                ? prev.filter((s) => s !== size)
                : [...prev, size]
        );
    };

    // Upload on submit
    const handleAddProduct = async (data) => {
        try {
            if (!thumbnailFile)
                return toast.error("Thumbnail is required");

            const validImageFiles = productFiles.filter((f) => f !== null);
            if (validImageFiles.length === 0)
                return toast.error("Upload at least one product image");

            if (availableSizes.length > 0 && selectedSizes.length === 0)
                return toast.error("Select at least one size");

            // Begin Upload
            setUploading(true);
            setUploadProgress(0);

            const allFiles = [thumbnailFile, ...validImageFiles];

            // Total bytes
            const totalBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
            let uploadedBytes = 0;

            const urls = [];

            for (const file of allFiles) {
                const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snap) => {
                            const overall = Math.round(
                                ((uploadedBytes + snap.bytesTransferred) / totalBytes) * 100
                            );
                            setUploadProgress(overall);
                        },
                        reject,
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            urls.push(url);
                            uploadedBytes += file.size;
                            resolve();
                        }
                    );
                });
            }

            const [thumbnailUrl, ...imagesUrls] = urls;

            const payload = {
                ...data,
                thumbnail: thumbnailUrl,
                images: imagesUrls,
                sizes: selectedSizes.length ? selectedSizes : undefined,
                discountPercentage: data.discountPercentage
                    ? Number(data.discountPercentage)
                    : 0,
            };

            dispatch(addProductAsync(payload));

        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", pb: isMobile ? 12 : 4 }}>
            {/* HEADER */}
            <Box
                sx={{
                    bgcolor: "white",
                    borderBottom: "1px solid #e5e7eb",
                    py: 2.5,
                    px: { xs: 2, sm: 3, md: 4 },
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton component={Link} to="/admin/dashboard" sx={{ bgcolor: "grey.100" }}>
                        <ArrowBackIcon />
                    </IconButton>

                    <Box>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
                            Add New Product
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* CONTENT */}
            <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2, mt: 3 }}>
                <form onSubmit={handleSubmit(handleAddProduct)}>
                    <Grid container spacing={3}>

                        {/* BASIC INFO */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} mb={3}>
                                        Basic Information
                                    </Typography>

                                    <Grid container spacing={2}>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Product Title *"
                                                {...register("title", { required: true })}
                                                error={!!errors.title}
                                                helperText={errors.title && "Title is required"}
                                            />
                                        </Grid>

                                        {/* BRAND */}
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth error={!!errors.brand}>
                                                <InputLabel>Brand *</InputLabel>
                                                <Select
                                                    label="Brand"
                                                    defaultValue=""
                                                    {...register("brand", { required: true })}
                                                >
                                                    {brands.map((b) => (
                                                        <MenuItem key={b._id} value={b._id}>
                                                            {b.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {/* CATEGORY */}
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth error={!!errors.category}>
                                                <InputLabel>Category *</InputLabel>
                                                <Select
                                                    label="Category"
                                                    defaultValue=""
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

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Description *"
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

                        {/* PRICING */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} mb={3}>
                                        Pricing & Stock
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Price (₹) *"
                                                {...register("price", { required: true, min: 0 })}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Discount %"
                                                inputProps={{ min: 0, max: 100 }}
                                                {...register("discountPercentage")}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Stock Quantity *"
                                                {...register("stockQuantity", { required: true, min: 0 })}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* SIZES */}
                        {availableSizes.length > 0 && (
                            <Grid item xs={12}>
                                <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                                    <CardContent>
                                        <Typography variant="h6" fontWeight={600} mb={2}>
                                            Available Sizes *
                                        </Typography>

                                        <Stack direction="row" gap={1.5} flexWrap="wrap">
                                            {availableSizes.map((size) => (
                                                <Chip
                                                    key={size}
                                                    label={size}
                                                    onClick={() => toggleSize(size)}
                                                    color={
                                                        selectedSizes.includes(size)
                                                            ? "primary"
                                                            : "default"
                                                    }
                                                    variant={
                                                        selectedSizes.includes(size)
                                                            ? "filled"
                                                            : "outlined"
                                                    }
                                                    icon={
                                                        selectedSizes.includes(size)
                                                            ? <CheckCircleIcon />
                                                            : undefined
                                                    }
                                                    sx={{ px: 2, py: 1, borderRadius: 2 }}
                                                />
                                            ))}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {/* IMAGES */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} mb={3}>
                                        Product Images
                                    </Typography>

                                    {/* THUMBNAIL */}
                                    <Box mb={3}>
                                        <Typography fontWeight={600} mb={2}>
                                            Thumbnail Image *
                                        </Typography>

                                        <Stack direction="row" gap={2} alignItems="center">
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                startIcon={<PhotoCamera />}
                                            >
                                                {thumbnailPreview ? "Change" : "Upload"}
                                                <input hidden type="file" accept="image/*" onChange={handleThumbnailChange} />
                                            </Button>

                                            {thumbnailPreview && (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        border: "2px solid",
                                                        borderColor: "primary.main",
                                                        borderRadius: 2,
                                                        position: "relative",
                                                    }}
                                                >
                                                    <img
                                                        src={thumbnailPreview}
                                                        style={{
                                                            width: 100,
                                                            height: 100,
                                                            objectFit: "cover",
                                                            borderRadius: 8,
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
                                                        }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </Paper>
                                            )}
                                        </Stack>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* ADDITIONAL IMAGES */}
                                    <Typography fontWeight={600} mb={2}>
                                        Additional Images * (at least 1)
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {[0, 1, 2, 3].map((idx) => (
                                            <Grid item xs={6} sm={3} key={idx}>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        border: "2px dashed",
                                                        borderColor: imagePreviews[idx]
                                                            ? "primary.main"
                                                            : "grey.300",
                                                        borderRadius: 2,
                                                        p: 2,
                                                        textAlign: "center",
                                                        position: "relative",
                                                        bgcolor: imagePreviews[idx]
                                                            ? "transparent"
                                                            : "grey.50",
                                                    }}
                                                >
                                                    {imagePreviews[idx] ? (
                                                        <>
                                                            <img
                                                                src={imagePreviews[idx]}
                                                                style={{
                                                                    width: "100%",
                                                                    height: 120,
                                                                    objectFit: "cover",
                                                                    borderRadius: 8,
                                                                }}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRemoveProductImage(idx)}
                                                                sx={{
                                                                    position: "absolute",
                                                                    top: 8,
                                                                    right: 8,
                                                                    bgcolor: "error.main",
                                                                    color: "white",
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
                                                                flexDirection: "column",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <AddPhotoAlternateIcon sx={{ fontSize: 40 }} />
                                                            <Typography variant="caption">
                                                                Image {idx + 1}
                                                            </Typography>
                                                            <input
                                                                hidden
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleProductImageChange(e, idx)}
                                                            />
                                                        </Button>
                                                    )}
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* ACTION BUTTON */}
                        <Grid item xs={12}>
                            <Stack direction="row" justifyContent="flex-end" gap={2}>

                                <Button
                                    variant="outlined"
                                    component={Link}
                                    to="/admin/dashboard"
                                >
                                    Cancel
                                </Button>

                                <Box>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={uploading}
                                        startIcon={<SaveIcon />}
                                    >
                                        {uploading ? "Uploading..." : "Save Product"}
                                    </Button>

                                    {uploading && (
                                        <Box sx={{ width: 250, mt: 1 }}>
                                            <LinearProgress variant="determinate" value={uploadProgress} />
                                            <Typography variant="caption">{uploadProgress}%</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>
            </Box>

            {/* MOBILE SAVE BUTTON */}
            {isMobile && (
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 0,
                        width: "100%",
                        height: 70,
                        bgcolor: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(10px)",
                        zIndex: 1000,
                    }}
                >
                    <Fab
                        type="submit"
                        onClick={handleSubmit(handleAddProduct)}
                        sx={{
                            position: "absolute",
                            left: "50%",
                            top: -30,
                            transform: "translateX(-50%)",
                            bgcolor: "#000",
                        }}
                    >
                        {uploading ? (
                            <CircularProgress size={20} sx={{ color: "#fff" }} />
                        ) : (
                            <SaveIcon sx={{ color: "#fff" }} />
                        )}
                    </Fab>
                </Box>
            )}
        </Box>
    );
};

export default AddProduct;
