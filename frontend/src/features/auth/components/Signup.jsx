import {
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
import {
    selectLoggedInUser,
    signupAsync,
    selectSignupStatus,
    selectSignupError,
    clearSignupError,
    resetSignupStatus
} from '../AuthSlice';
import { toast } from 'react-toastify';
import { MotionConfig, motion } from 'framer-motion';

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
    }, [loggedInUser]);

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
    }, [status]);

    const handleSignup = (data) => {
        const cred = { ...data };
        delete cred.confirmPassword;
        dispatch(signupAsync(cred));
    };

    return (
        <Stack width={'100vw'} height={'100vh'} flexDirection={'row'} sx={{ overflowY: "hidden" }}>
            {!is900 && (
                <Stack bgcolor={'black'} flex={1} justifyContent={'center'}>
                    <Lottie animationData={ecommerceOutlookAnimation} />
                </Stack>
            )}

            <Stack flex={1} justifyContent={'center'} alignItems={'center'}>
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

                    {/* Signup Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 1 }}>
                        <LoadingButton
                            sx={{
                                height: '2.5rem',
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

                    {/* Footer Links */}
                    <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap-reverse'}>
                        <MotionConfig whileHover={{ x: 2 }} whileTap={{ scale: 1.05 }}>
                            <motion.div>
                                <Typography
                                    mr={'1.5rem'}
                                    sx={{ textDecoration: "none", color: "text.primary" }}
                                    to={'/forgot-password'}
                                    component={Link}
                                >
                                    Forgot password
                                </Typography>
                            </motion.div>

                            <motion.div>
                                <Typography
                                    sx={{ textDecoration: "none", color: "text.primary" }}
                                    to={'/login'}
                                    component={Link}
                                >
                                    Already a member?{' '}
                                    <span style={{ color: theme.palette.primary.dark }}>Login</span>
                                </Typography>
                            </motion.div>
                        </MotionConfig>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};
