import {
    Avatar,
    Button,
    Paper,
    Stack,
    Typography,
    useTheme,
    TextField,
    useMediaQuery,
    IconButton,
    Grid,
    Box,
    Divider,
    Container,
    alpha,
    Fade,
    Chip
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectUserInfo } from '../UserSlice'
import {
    addAddressAsync,
    resetAddressAddStatus,
    resetAddressDeleteStatus,
    resetAddressUpdateStatus,
    selectAddressAddStatus,
    selectAddressDeleteStatus,
    selectAddressStatus,
    selectAddressUpdateStatus,
    selectAddresses
} from '../../address/AddressSlice'
import { Address } from '../../address/components/Address'
import { useForm } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonIcon from '@mui/icons-material/Person'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AddIcon from '@mui/icons-material/Add'
import EmailIcon from '@mui/icons-material/Email'

export const UserProfile = () => {
    const dispatch = useDispatch()
    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    const status = useSelector(selectAddressStatus)
    const userInfo = useSelector(selectUserInfo)
    const addresses = useSelector(selectAddresses)
    const theme = useTheme()
    const [addAddress, setAddAddress] = useState(false)

    const addressAddStatus = useSelector(selectAddressAddStatus)
    const addressUpdateStatus = useSelector(selectAddressUpdateStatus)
    const addressDeleteStatus = useSelector(selectAddressDeleteStatus)

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "instant"
        })
    }, [])

    useEffect(() => {
        if (addressAddStatus === 'fulfilled') {
            toast.success("Address added")
            setAddAddress(false)
            reset()
        } else if (addressAddStatus === 'rejected') {
            toast.error("Error adding address, please try again later")
        }
    }, [addressAddStatus])

    useEffect(() => {
        if (addressUpdateStatus === 'fulfilled') {
            toast.success("Address updated")
        } else if (addressUpdateStatus === 'rejected') {
            toast.error("Error updating address, please try again later")
        }
    }, [addressUpdateStatus])

    useEffect(() => {
        if (addressDeleteStatus === 'fulfilled') {
            toast.success("Address deleted")
        } else if (addressDeleteStatus === 'rejected') {
            toast.error("Error deleting address, please try again later")
        }
    }, [addressDeleteStatus])

    useEffect(() => {
        return () => {
            dispatch(resetAddressAddStatus())
            dispatch(resetAddressUpdateStatus())
            dispatch(resetAddressDeleteStatus())
        }
    }, [])

    const handleAddAddress = (data) => {
        const address = { ...data, user: userInfo._id }
        dispatch(addAddressAsync(address))
    }

    const handleResetForm = () => {
        reset()
        setAddAddress(false)
    }

    // Phone number validation patterns
    const phoneValidation = {
        required: "Phone number is required",
        pattern: {
            value: /^(\+91[\s]?)?[6-9]\d{9}$/,
            message: "Enter a valid 10-digit Indian mobile number"
        },
        minLength: {
            value: 10,
            message: "Phone number must be at least 10 digits"
        },
        maxLength: {
            value: 13,
            message: "Phone number cannot exceed 13 digits (with country code)"
        }
    }

    // Postal code validation for India
    const postalCodeValidation = {
        required: "Postal code is required",
        pattern: {
            value: /^[1-9][0-9]{5}$/,
            message: "Enter a valid 6-digit postal code"
        },
        minLength: {
            value: 6,
            message: "Postal code must be 6 digits"
        },
        maxLength: {
            value: 6,
            message: "Postal code must be 6 digits"
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 4 }}>
            {/* Simple Clean Header */}
            <Box
                sx={{
                    bgcolor: 'white',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 2
                }}
            >
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton
                            component={Link}
                            to="/"
                            size="small"
                            sx={{
                                bgcolor: 'grey.100',
                                '&:hover': {
                                    bgcolor: 'grey.200',
                                }
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
                            My Profile
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <Stack spacing={3}>
                    {/* User Info Card - Improved */}
                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            overflow: 'hidden',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                            }
                        }}
                    >
                        <Box sx={{ p: { xs: 3, sm: 4 } }}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={3}
                                alignItems={{ xs: 'center', sm: 'flex-start' }}
                            >
                                <Avatar
                                    src="none"
                                    alt={userInfo?.name}
                                    sx={{
                                        width: { xs: 80, sm: 100 },
                                        height: { xs: 80, sm: 100 },
                                        bgcolor: 'primary.main',
                                        fontSize: { xs: '2rem', sm: '2.5rem' }
                                    }}
                                >
                                    <PersonIcon fontSize="inherit" />
                                </Avatar>

                                <Stack
                                    spacing={1.5}
                                    flex={1}
                                    alignItems={{ xs: 'center', sm: 'flex-start' }}
                                    textAlign={{ xs: 'center', sm: 'left' }}
                                >
                                    <Typography
                                        variant={isMobile ? "h5" : "h4"}
                                        fontWeight={700}
                                    >
                                        {userInfo?.name}
                                    </Typography>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="body1" color="text.secondary">
                                            {userInfo?.email}
                                        </Typography>
                                    </Stack>

                                    <Chip
                                        icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                                        label={`${addresses.length} Saved Address${addresses.length !== 1 ? 'es' : ''}`}
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                            mt: 1
                                        }}
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    </Paper>

                    {/* Addresses Section - Improved Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            overflow: 'hidden',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                            }
                        }}
                    >
                        {/* Section Header */}
                        <Box
                            sx={{
                                p: { xs: 2, sm: 3 },
                                bgcolor: 'grey.50',
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                flexWrap="wrap"
                                gap={2}
                            >
                                <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
                                    <LocationOnIcon color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                            Delivery Addresses
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                            Manage your saved locations
                                        </Typography>
                                    </Box>
                                </Stack>

                                {!addAddress && (
                                    <Button
                                        variant="contained"
                                        size={isMobile ? "small" : "medium"}
                                        startIcon={<AddIcon />}
                                        onClick={() => setAddAddress(true)}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            px: { xs: 2, sm: 3 }
                                        }}
                                    >
                                        Add New
                                    </Button>
                                )}
                            </Stack>
                        </Box>

                        <Box sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack spacing={3}>
                                {/* Add Address Form */}
                                {addAddress && (
                                    <Fade in={addAddress}>
                                        <Paper
                                            component="form"
                                            noValidate
                                            onSubmit={handleSubmit(handleAddAddress)}
                                            elevation={0}
                                            sx={{
                                                p: { xs: 2.5, sm: 3 },
                                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                                border: '2px dashed',
                                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                                borderRadius: 2,
                                            }}
                                        >
                                            <Stack spacing={{ xs: 2, sm: 2.5 }}>
                                                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.938rem', sm: '1rem' } }}>
                                                    Add New Address
                                                </Typography>

                                                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="Address Type"
                                                            placeholder="Home, Office, etc."
                                                            error={!!errors.type}
                                                            {...register("type", {
                                                                required: "Address type is required",
                                                                minLength: {
                                                                    value: 2,
                                                                    message: "Address type must be at least 2 characters"
                                                                }
                                                            })}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="Phone Number"
                                                            type="tel"
                                                            placeholder="10-digit mobile number"
                                                            error={!!errors.phoneNumber}
                                                            {...register("phoneNumber", phoneValidation)}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="Street Address"
                                                            placeholder="House no, Building name, Street"
                                                            multiline
                                                            rows={2}
                                                            error={!!errors.street}
                                                            helperText={errors.street?.message}
                                                            {...register("street", {
                                                                required: "Street address is required",
                                                                minLength: {
                                                                    value: 5,
                                                                    message: "Street address must be at least 5 characters"
                                                                }
                                                            })}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="City"
                                                            placeholder="e.g., Mumbai"
                                                            error={!!errors.city}
                                                            helperText={errors.city?.message}
                                                            {...register("city", {
                                                                required: "City is required",
                                                                minLength: {
                                                                    value: 2,
                                                                    message: "City name must be at least 2 characters"
                                                                },
                                                                pattern: {
                                                                    value: /^[a-zA-Z\s]+$/,
                                                                    message: "City name should only contain letters"
                                                                }
                                                            })}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="State"
                                                            placeholder="e.g., Maharashtra"
                                                            error={!!errors.state}
                                                            helperText={errors.state?.message}
                                                            {...register("state", {
                                                                required: "State is required",
                                                                minLength: {
                                                                    value: 2,
                                                                    message: "State name must be at least 2 characters"
                                                                },
                                                                pattern: {
                                                                    value: /^[a-zA-Z\s]+$/,
                                                                    message: "State name should only contain letters"
                                                                }
                                                            })}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="Postal Code"
                                                            placeholder="6-digit PIN"
                                                            error={!!errors.postalCode}
                                                            {...register("postalCode", postalCodeValidation)}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <TextField
                                                            fullWidth
                                                            size={isMobile ? "small" : "medium"}
                                                            label="Country"
                                                            placeholder="e.g., India"
                                                            error={!!errors.country}
                                                            helperText={errors.country?.message}
                                                            {...register("country", {
                                                                required: "Country is required",
                                                                minLength: {
                                                                    value: 2,
                                                                    message: "Country name must be at least 2 characters"
                                                                },
                                                                pattern: {
                                                                    value: /^[a-zA-Z\s]+$/,
                                                                    message: "Country name should only contain letters"
                                                                }
                                                            })}
                                                        />
                                                    </Grid>
                                                </Grid>

                                                <Stack
                                                    direction="row"
                                                    spacing={1.5}
                                                    justifyContent="flex-end"
                                                    flexWrap="wrap"
                                                    gap={1}
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        size={isMobile ? "small" : "medium"}
                                                        onClick={handleResetForm}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: { xs: 2, sm: 3 },
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <LoadingButton
                                                        loading={status === 'pending'}
                                                        type="submit"
                                                        variant="contained"
                                                        size={isMobile ? "small" : "medium"}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: { xs: 2, sm: 3 },
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        Save Address
                                                    </LoadingButton>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    </Fade>
                                )}

                                {/* Address List */}
                                {addresses.length > 0 ? (
                                    <Stack spacing={{ xs: 1.5, sm: 2 }}>
                                        {addresses.map((address, index) => (
                                            <Fade in key={address._id} timeout={200 + (index * 100)}>
                                                <Box>
                                                    <Address
                                                        id={address._id}
                                                        city={address.city}
                                                        country={address.country}
                                                        phoneNumber={address.phoneNumber}
                                                        postalCode={address.postalCode}
                                                        state={address.state}
                                                        street={address.street}
                                                        type={address.type}
                                                    />
                                                </Box>
                                            </Fade>
                                        ))}
                                    </Stack>
                                ) : (
                                    !addAddress && (
                                        <Box
                                            sx={{
                                                textAlign: 'center',
                                                py: { xs: 6, sm: 8 },
                                            }}
                                        >
                                            <LocationOnIcon
                                                sx={{
                                                    fontSize: { xs: 60, sm: 80 },
                                                    color: 'text.disabled',
                                                    mb: 2
                                                }}
                                            />
                                            <Typography
                                                variant="h6"
                                                fontWeight={600}
                                                color="text.primary"
                                                gutterBottom
                                            >
                                                No addresses saved yet
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 3 }}
                                            >
                                                Add your first delivery address to get started
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => setAddAddress(true)}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                    px: 3
                                                }}
                                            >
                                                Add Your First Address
                                            </Button>
                                        </Box>
                                    )
                                )}
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    )
}