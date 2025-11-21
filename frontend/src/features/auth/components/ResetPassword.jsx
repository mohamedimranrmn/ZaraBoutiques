// frontend/src/features/auth/components/ResetPassword.jsx

import {
    FormHelperText,
    Paper,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    Box,
} from "@mui/material";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
    clearResetPasswordError,
    clearResetPasswordSuccessMessage,
    resetPasswordAsync,
    resetResetPasswordStatus,
    selectResetPasswordError,
    selectResetPasswordStatus,
    selectResetPasswordSuccessMessage,
} from "../AuthSlice";
import { LoadingButton } from "@mui/lab";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";

export const ResetPassword = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const dispatch = useDispatch();
    const status = useSelector(selectResetPasswordStatus);
    const error = useSelector(selectResetPasswordError);
    const successMessage = useSelector(selectResetPasswordSuccessMessage);
    const { userId, passwordResetToken } = useParams();
    const navigate = useNavigate();

    const theme = useTheme();
    const is500 = useMediaQuery(theme.breakpoints.down(500));

    /* -----------------------------------------
       Toast: Error
       ----------------------------------------- */
    useEffect(() => {
        if (error) toast.error(error.message);
        return () => dispatch(clearResetPasswordError());
    }, [error]);

    /* -----------------------------------------
       Toast: Success
       ----------------------------------------- */
    useEffect(() => {
        if (status === "fullfilled") {
            toast.success(successMessage?.message);
            navigate("/login");
        }
        return () => dispatch(clearResetPasswordSuccessMessage());
    }, [status]);

    /* -----------------------------------------
       Cleanup
       ----------------------------------------- */
    useEffect(() => {
        return () => {
            dispatch(resetResetPasswordStatus());
        };
    }, []);

    const handleResetPassword = async (data) => {
        const payload = {
            ...data,
            userId: userId,
            token: passwordResetToken,
        };
        delete payload.confirmPassword;

        dispatch(resetPasswordAsync(payload));
        reset();
    };

    return (
        <Box
            sx={{
                width: "100vw",
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                px: 2,
                py: 4,
                background: "linear-gradient(135deg, #fafafa 0%, #f2f3f5 100%)",
            }}
        >
            <Stack
                component={Paper}
                elevation={4}
                sx={{
                    width: "100%",
                    maxWidth: 430,
                    p: is500 ? 2 : 4,
                    borderRadius: 3,
                    backdropFilter: "blur(10px)",
                    backgroundColor: "rgba(255,255,255,0.85)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
            >
                {/* ---------------------- HEADER ---------------------- */}
                <Stack spacing={0.5} mb={2}>
                    <Typography variant="h4" fontWeight={700}>
                        Reset Password
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Enter your new password and confirm it below.
                    </Typography>
                </Stack>

                {/* ---------------------- FORM ---------------------- */}
                <Stack
                    component={"form"}
                    onSubmit={handleSubmit(handleResetPassword)}
                    spacing={2.5}
                >
                    <MotionConfig whileHover={{ y: -2 }}>
                        <motion.div>
                            <TextField
                                fullWidth
                                type="password"
                                placeholder="New Password"
                                {...register("password", {
                                    required: "Please enter a password",
                                    pattern: {
                                        value:
                                            /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm,
                                        message:
                                            "Must be 8+ chars, contain uppercase, lowercase & number",
                                    },
                                })}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "#fafafa",
                                    },
                                }}
                            />
                            {errors.password && (
                                <FormHelperText error sx={{ mt: 0.5 }}>
                                    {errors.password.message}
                                </FormHelperText>
                            )}
                        </motion.div>

                        <motion.div>
                            <TextField
                                fullWidth
                                type="password"
                                placeholder="Confirm New Password"
                                {...register("confirmPassword", {
                                    required: "Please confirm the password",
                                    validate: (value, formValues) =>
                                        value === formValues.password || "Passwords do not match",
                                })}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "#fafafa",
                                    },
                                }}
                            />
                            {errors.confirmPassword && (
                                <FormHelperText error sx={{ mt: 0.5 }}>
                                    {errors.confirmPassword.message}
                                </FormHelperText>
                            )}
                        </motion.div>
                    </MotionConfig>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 1 }}>
                        <LoadingButton
                            fullWidth
                            loading={status === "pending"}
                            type="submit"
                            variant="contained"
                            sx={{
                                height: "2.8rem",
                                borderRadius: 2,
                                fontSize: "1rem",
                                fontWeight: 600,
                            }}
                        >
                            Reset Password
                        </LoadingButton>
                    </motion.div>
                </Stack>

                {/* ---------------------- FOOTER NAV ---------------------- */}
                <motion.div
                    whileHover={{ x: 3 }}
                    style={{
                        width: "100%",               // allow full width
                        display: "flex",             // enable flex centering
                        justifyContent: "center",    // horizontal center
                        marginTop: "1.5rem"          // extra spacing
                    }}
                >
                    <Typography
                        component={Link}
                        to="/login"
                        variant="body2"
                        sx={{
                            textDecoration: "none",
                            color: "text.secondary",
                            display: "inline-block"
                        }}
                    >
                        Back to <span style={{ color: theme.palette.primary.main }}>Login</span>
                    </Typography>
                </motion.div>
            </Stack>
        </Box>
    );
};
