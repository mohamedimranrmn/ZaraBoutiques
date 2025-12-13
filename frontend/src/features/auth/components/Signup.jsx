import {
    Box,
    FormHelperText,
    Stack,
    TextField,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { ecommerceOutlookAnimation } from '../../../assets';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { GoogleLogin } from "@react-oauth/google";
import { toast } from 'react-toastify';
import { MotionConfig, motion } from 'framer-motion';
import {
    selectLoggedInUser,
    signupAsync,
    googleLoginAsync,
    selectSignupStatus,
    selectSignupError,
    clearSignupError,
    resetSignupStatus
} from '../AuthSlice';
import Snowfall from "react-snowfall";

export const Signup = () => {
    const dispatch = useDispatch();
    const status = useSelector(selectSignupStatus);
    const error = useSelector(selectSignupError);
    const loggedInUser = useSelector(selectLoggedInUser);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const theme = useTheme();
    const is900 = useMediaQuery(theme.breakpoints.down(900));
    const is480 = useMediaQuery(theme.breakpoints.down(480));

    // Redirect after signup
    useEffect(() => {
        if (loggedInUser && !loggedInUser?.isVerified) navigate("/verify-otp");
        else if (loggedInUser) navigate("/");
    }, [loggedInUser, navigate]);

    // Handle signup error
    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    // Handle signup success
    useEffect(() => {
        if (status === 'fullfilled') {
            toast.success("Welcome! Verify your email to start shopping on Zara Boutiques.");
            reset();
        }
        return () => {
            dispatch(clearSignupError());
            dispatch(resetSignupStatus());
        };
    }, [status, dispatch, reset]);

    const handleSignup = (data) => {
        const cred = { ...data };
        delete cred.confirmPassword;
        dispatch(signupAsync(cred));
    };

    const handleGoogleSignup = async (credentialResponse) => {
        const credential = credentialResponse.credential;
        if (!credential) {
            toast.error("Google signup failed");
            return;
        }
        try {
            const resultAction = await dispatch(googleLoginAsync(credential));
            if (googleLoginAsync.fulfilled.match(resultAction)) {
                console.log("✅ Google signup successful");
            } else {
                const errorMsg = resultAction.payload?.message || "Google authentication failed";
                toast.error(errorMsg);
            }
        } catch (err) {
            console.error("Google signup error:", err);
            toast.error("An unexpected error occurred");
        }
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
                    px: is900 ? 2 : 0,
                    display: is900 ? 'flex' : 'flex'
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
                {/* Zara Boutiques Header */}
                <Stack flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                    <Stack rowGap={'.4rem'}>
                        <Typography
                            variant='h2'
                            fontWeight={700}
                            sx={{
                                wordBreak: "break-word",
                                background: 'linear-gradient(45deg, #000000 30%, #DB4444 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            ZARA BOUTIQUES
                        </Typography>
                        <Typography alignSelf={'flex-end'} color={'GrayText'} variant='body2'>
                            — Fashion Hub for Women
                        </Typography>
                    </Stack>
                </Stack>

                {/* Signup Form */}
                <Stack
                    mt={4}
                    spacing={2}
                    width={is480 ? "95vw" : '28rem'}
                    component={'form'}
                    noValidate
                    onSubmit={handleSubmit(handleSignup)}
                >
                    <MotionConfig whileHover={{ y: -5 }}>
                        <motion.div>
                            <TextField
                                fullWidth
                                {...register("name", { required: "Username is required" })}
                                placeholder='Username'
                            />
                            {errors.name && <FormHelperText error>{errors.name.message}</FormHelperText>}
                        </motion.div>

                        <motion.div>
                            <TextField
                                fullWidth
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value:
                                            /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
                                        message: "Enter a valid email"
                                    }
                                })}
                                placeholder='Email'
                            />
                            {errors.email && <FormHelperText error>{errors.email.message}</FormHelperText>}
                        </motion.div>

                        <motion.div>
                            <TextField
                                type='password'
                                fullWidth
                                {...register("password", {
                                    required: "Password is required",
                                    pattern: {
                                        value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm,
                                        message:
                                            "At least 8 characters, must contain uppercase, lowercase, and a number"
                                    }
                                })}
                                placeholder='Password'
                            />
                            {errors.password && <FormHelperText error>{errors.password.message}</FormHelperText>}
                        </motion.div>

                        <motion.div>
                            <TextField
                                type='password'
                                fullWidth
                                {...register("confirmPassword", {
                                    required: "Confirm Password is required",
                                    validate: (value, formValues) =>
                                        value === formValues.password || "Passwords don't match"
                                })}
                                placeholder='Confirm Password'
                            />
                            {errors.confirmPassword && (
                                <FormHelperText error>{errors.confirmPassword.message}</FormHelperText>
                            )}
                        </motion.div>
                    </MotionConfig>

                    {/* Signup Buttons - Equal Size Side by Side */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* Email Signup Button */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                            style={{ flex: 1 }}
                        >
                            <LoadingButton
                                sx={{
                                    height: '2.8rem',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#DB4444',
                                    '&:hover': { backgroundColor: '#b73535' }
                                }}
                                fullWidth
                                loading={status === 'pending'}
                                type='submit'
                                variant='contained'
                            >
                                Signup
                            </LoadingButton>
                        </motion.div>

                        {/* Google Signup Button */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                            style={{ flex: 1 }}
                        >
                            <Box
                                onClick={() => {
                                    document.querySelector('[role="button"]')?.click();
                                }}
                                sx={{
                                    border: "2px solid",
                                    borderColor: "divider",
                                    borderRadius: "4px",
                                    height: "2.8rem",
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 1,
                                    cursor: "pointer",
                                    bgcolor: "background.paper",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        bgcolor: "action.hover",
                                        borderColor: "#4285f4"
                                    }
                                }}
                            >
                                <Box
                                    component="img"
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    sx={{ width: 20, height: 20 }}
                                />
                                <Typography variant="body1" fontWeight={500}>
                                    Google
                                </Typography>
                            </Box>
                        </motion.div>

                        {/* Hidden Google button */}
                        <Box sx={{ display: "none" }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSignup}
                                onError={() => toast.error("Google Signup Failed")}
                            />
                        </Box>
                    </Stack>

                    {/* Footer Links */}
                    <Stack
                        mt={1}
                        width="100%"
                        alignItems="flex-start"
                    >
                        <MotionConfig whileHover={{ x: 2 }} whileTap={{ scale: 1.05 }}>

                            {/* Already a member */}
                            <motion.div>
                                <Typography
                                    sx={{ textDecoration: "none", color: "text.primary" }}
                                    to={'/login'}
                                    component={Link}
                                >
                                    Already a member?{" "}
                                    <span style={{ color: theme.palette.primary.dark }}>Login</span>
                                </Typography>
                            </motion.div>

                            {/* Forgot Password BELOW */}
                            <motion.div style={{ marginTop: "0.5rem" }}>
                                <Typography
                                    sx={{ textDecoration: "none", color: "text.danger" }}
                                    to={'/forgot-password'}
                                    component={Link}
                                >
                                    Forgot password?
                                </Typography>
                            </motion.div>

                        </MotionConfig>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};