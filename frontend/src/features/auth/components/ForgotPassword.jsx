import {
    Box,
    FormHelperText,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';
import {
    clearForgotPasswordError,
    clearForgotPasswordSuccessMessage,
    forgotPasswordAsync,
    resetForgotPasswordStatus,
    selectForgotPasswordError,
    selectForgotPasswordStatus,
    selectForgotPasswordSuccessMessage
} from '../AuthSlice';
import { LoadingButton } from '@mui/lab';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import Lottie from 'lottie-react';
import { ecommerceOutlookAnimation } from '../../../assets';
import Snowfall from 'react-snowfall';

export const ForgotPassword = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const dispatch = useDispatch();
    const status = useSelector(selectForgotPasswordStatus);
    const error = useSelector(selectForgotPasswordError);
    const successMessage = useSelector(selectForgotPasswordSuccessMessage);

    const theme = useTheme();
    const is900 = useMediaQuery(theme.breakpoints.down(900));
    const is480 = useMediaQuery(theme.breakpoints.down(480));

    /* -------------------- Toast Handlers -------------------- */
    useEffect(() => {
        if (error) toast.error(error?.message);
        return () => dispatch(clearForgotPasswordError());
    }, [error]);

    useEffect(() => {
        if (status === "fullfilled") toast.success(successMessage?.message);
        return () => dispatch(clearForgotPasswordSuccessMessage());
    }, [status]);

    useEffect(() => {
        return () => dispatch(resetForgotPasswordStatus());
    }, []);

    const handleForgotPassword = (data) => {
        dispatch(forgotPasswordAsync(data));
        reset();
    };

    return (
        <Stack
            width={'100vw'}
            height={'100vh'}
            flexDirection={is900 ? 'column' : 'row'}
            sx={{ overflowY: is900 ? 'auto' : 'hidden' }}
        >
            {/* Left Animation Section */}
            <Stack
                bgcolor={'black'}
                flex={1}
                justifyContent={'center'}
                alignItems={'center'}
                sx={{
                    height: is900 ? 'auto' : 'auto',
                    minHeight: is900 ? '250px' : 'auto',
                    py: is900 ? 3 : 0,
                    px: is900 ? 2 : 0
                }}
            >
                <Snowfall color="grey" enable3DRotation={true} snowflakeCount={500}/>
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: is900 ? '400px' : '100%',
                        height: is900 ? 'auto' : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Lottie
                        animationData={ecommerceOutlookAnimation}
                        style={{
                            width: '100%',
                            height: '100%',
                            maxHeight: is900 ? '300px' : 'none'
                        }}
                    />
                </Box>
            </Stack>

            {/* Right Form Section */}
            <Stack
                flex={1}
                justifyContent={'center'}
                alignItems={'center'}
                sx={{ py: is900 ? 4 : 0 }}
            >
                {/* Forgot Password Form */}
                <Stack
                    mt={4}
                    spacing={2}
                    width={is480 ? '95vw' : '28rem'}
                >
                    {/* Header Section */}
                    <Stack spacing={1}>
                        <Typography
                            variant={is480 ? "h5" : "h4"}
                            fontWeight={700}
                        >
                            {status === "fullfilled"
                                ? "Email Sent!"
                                : "Forgot Your Password?"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.6 }}
                        >
                            {status === "fullfilled"
                                ? "Please check your email and click the link we sent to reset your password."
                                : "Enter your registered email address and we'll send you a password reset link."}
                        </Typography>
                    </Stack>

                    {/* Form */}
                    {status !== "fullfilled" && (
                        <Stack
                            component={'form'}
                            spacing={2}
                            noValidate
                            onSubmit={handleSubmit(handleForgotPassword)}
                        >
                            {/* Email Input */}
                            <motion.div whileHover={{ y: -5 }}>
                                <TextField
                                    fullWidth
                                    placeholder='Email'
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Enter a valid email"
                                        }
                                    })}
                                />
                                {errors.email && (
                                    <FormHelperText error sx={{ mt: 1 }}>
                                        {errors.email.message}
                                    </FormHelperText>
                                )}
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 1 }}
                            >
                                <LoadingButton
                                    fullWidth
                                    loading={status === "pending"}
                                    type="submit"
                                    variant="contained"
                                    sx={{
                                        height: '2.8rem',
                                        backgroundColor: '#DB4444',
                                        '&:hover': { backgroundColor: '#b73535' },
                                    }}
                                >
                                    Send Reset Link
                                </LoadingButton>
                            </motion.div>
                        </Stack>
                    )}

                    {/* Links Section */}
                    <Stack
                        mt={1}
                        width="100%"
                        alignItems="flex-start"
                    >
                        <MotionConfig whileHover={{ x: 2 }} whileTap={{ scale: 1.05 }}>
                            <motion.div>
                                <Typography
                                    sx={{ textDecoration: 'none', color: 'text.primary' }}
                                    to={'/login'}
                                    component={Link}
                                >
                                    Remember your password?{' '}
                                    <span style={{ color: theme.palette.primary.dark }}>Login</span>
                                </Typography>
                            </motion.div>

                            <motion.div style={{ marginTop: '0.5rem' }}>
                                <Typography
                                    sx={{ textDecoration: 'none', color: 'text.primary' }}
                                    to={'/signup'}
                                    component={Link}
                                >
                                    Don't have an account?{' '}
                                    <span style={{ color: theme.palette.primary.dark }}>Register</span>
                                </Typography>
                            </motion.div>
                        </MotionConfig>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};