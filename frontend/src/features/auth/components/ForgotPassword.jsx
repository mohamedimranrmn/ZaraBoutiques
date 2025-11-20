import {
    FormHelperText,
    Paper,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    Box
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
import { motion } from 'framer-motion';

export const ForgotPassword = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const dispatch = useDispatch();
    const status = useSelector(selectForgotPasswordStatus);
    const error = useSelector(selectForgotPasswordError);
    const successMessage = useSelector(selectForgotPasswordSuccessMessage);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("600"));

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
            width="100vw"
            height="100vh"
            justifyContent="center"
            alignItems="center"
            sx={{ bgcolor: "#fafafa" }}
        >

            {/* -------------------- CONTAINER -------------------- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        width: isMobile ? "90%" : "420px",
                        borderRadius: 3,
                        p: isMobile ? 3 : 4,
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <Stack spacing={3}>

                        {/* -------------------- HEADER -------------------- */}
                        <Stack spacing={1}>
                            <Typography
                                variant={isMobile ? "h5" : "h4"}
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
                                    : "Enter your registered email address and we’ll send you a password reset link."}
                            </Typography>
                        </Stack>

                        {/* -------------------- FORM -------------------- */}
                        {status !== "fullfilled" && (
                            <Stack
                                component="form"
                                spacing={2}
                                noValidate
                                onSubmit={handleSubmit(handleForgotPassword)}
                            >
                                {/* Email Input */}
                                <motion.div whileHover={{ scale: 1.01 }}>
                                    <TextField
                                        fullWidth
                                        size="medium"
                                        label="Email Address"
                                        placeholder="Enter your email"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Enter a valid email"
                                            }
                                        })}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 2,
                                            }
                                        }}
                                    />
                                    {errors.email && (
                                        <FormHelperText error sx={{ mt: 0.8 }}>
                                            {errors.email.message}
                                        </FormHelperText>
                                    )}
                                </motion.div>

                                {/* Submit Button */}
                                <motion.div whileHover={{ scale: 1.01 }}>
                                    <LoadingButton
                                        fullWidth
                                        loading={status === "pending"}
                                        type="submit"
                                        variant="contained"
                                        sx={{
                                            height: "3rem",
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontSize: "1rem",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Send Reset Link
                                    </LoadingButton>
                                </motion.div>
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </motion.div>

            {/* -------------------- BACK TO LOGIN -------------------- */}
            <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: "1.5rem" }}
            >
                <Typography
                    component={Link}
                    to="/login"
                    variant="body2"
                    sx={{
                        textDecoration: "none",
                        color: "text.primary",
                        fontWeight: 500
                    }}
                >
                    Go back to{" "}
                    <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                        Login
                    </span>
                </Typography>
            </motion.div>

        </Stack>
    );
};
