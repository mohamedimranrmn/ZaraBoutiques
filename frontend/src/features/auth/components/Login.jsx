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
import Lottie from 'lottie-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ecommerceOutlookAnimation } from '../../../assets';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { GoogleLogin } from "@react-oauth/google";
import { toast } from 'react-toastify';
import { MotionConfig, motion } from 'framer-motion';
import {
    selectLoggedInUser,
    loginAsync,
    googleLoginAsync,
    selectLoginStatus,
    selectLoginError,
    clearLoginError,
    resetLoginStatus
} from '../AuthSlice';

export const Login = () => {
    const [googleLoading, setGoogleLoading] = React.useState(false);
    const dispatch = useDispatch();
    const status = useSelector(selectLoginStatus);
    const error = useSelector(selectLoginError);
    const loggedInUser = useSelector(selectLoggedInUser);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const theme = useTheme();
    const is900 = useMediaQuery(theme.breakpoints.down(900));
    const is480 = useMediaQuery(theme.breakpoints.down(480));

    useEffect(() => {
        if (loggedInUser && loggedInUser?.isVerified) navigate('/');
        else if (loggedInUser && !loggedInUser?.isVerified) navigate('/verify-otp');
    }, [loggedInUser, navigate]);

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    useEffect(() => {
        if (status === 'fullfilled' && loggedInUser?.isVerified === true) {
            toast.success(`Login successful`);
            reset();
        }
        return () => {
            dispatch(clearLoginError());
            dispatch(resetLoginStatus());
        };
    }, [status, loggedInUser, dispatch, reset]);

    const handleLogin = (data) => {
        const cred = { ...data };
        delete cred.confirmPassword;
        dispatch(loginAsync(cred));
    };

    const handleGoogleLogin = async (credentialResponse) => {
        setGoogleLoading(true);

        const credential = credentialResponse.credential;
        if (!credential) {
            setGoogleLoading(false);
            toast.error("Google login failed");
            return;
        }

        try {
            const resultAction = await dispatch(googleLoginAsync(credential));

            if (googleLoginAsync.fulfilled.match(resultAction)) {
                console.log("Google login successful");
            } else {
                setGoogleLoading(false);
                toast.error(resultAction.payload?.message || "Google authentication failed");
            }
        } catch (err) {
            setGoogleLoading(false);
            toast.error("An unexpected error occurred");
        }
    };

    {googleLoading && (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(6px)",
                zIndex: 2000
            }}
        >
            <Box sx={{ width: 180 }}>
                <Lottie animationData={ecommerceOutlookAnimation} loop />
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
                Connecting to Google...
            </Typography>
        </Box>
    )}


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
                {/* Zara Boutiques Brand Header */}
                <Stack flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                    <Stack rowGap={'.4rem'}>
                        <Typography
                            variant='h2'
                            fontWeight={700}
                            sx={{
                                wordBreak: 'break-word',
                                background: 'linear-gradient(45deg, #000000 30%, #DB4444 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            ZARA BOUTIQUES
                        </Typography>
                        <Typography
                            alignSelf={'flex-end'}
                            color={'GrayText'}
                            variant='body2'
                            sx={{ fontWeight: 400 }}
                        >
                            — Fashion Hub for Women
                        </Typography>
                    </Stack>
                </Stack>

                {/* Login Form */}
                <Stack
                    mt={4}
                    spacing={2}
                    width={is480 ? '95vw' : '28rem'}
                    component={'form'}
                    noValidate
                    onSubmit={handleSubmit(handleLogin)}
                >
                    <motion.div whileHover={{ y: -5 }}>
                        <TextField
                            fullWidth
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value:
                                        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
                                    message: 'Enter a valid email'
                                }
                            })}
                            placeholder='Email'
                        />
                        {errors.email && (
                            <FormHelperText sx={{ mt: 1 }} error>
                                {errors.email.message}
                            </FormHelperText>
                        )}
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }}>
                        <TextField
                            type='password'
                            fullWidth
                            {...register('password', { required: 'Password is required' })}
                            placeholder='Password'
                        />
                        {errors.password && (
                            <FormHelperText sx={{ mt: 1 }} error>
                                {errors.password.message}
                            </FormHelperText>
                        )}
                    </motion.div>

                    {/* Login Buttons - Equal Size Side by Side */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* Email Login Button */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                            style={{ flex: 1 }}
                        >
                            <LoadingButton
                                fullWidth
                                sx={{
                                    height: '2.8rem',
                                    backgroundColor: '#DB4444',
                                    '&:hover': { backgroundColor: '#b73535' },
                                }}
                                loading={status === 'pending'}
                                type='submit'
                                variant='contained'
                            >
                                Login
                            </LoadingButton>
                        </motion.div>

                        {/* Google Login Button */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                            style={{ flex: 1 }}
                        >
                            <Box
                                onClick={() => {
                                    setGoogleLoading(true); // start loader immediately
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
                                onSuccess={handleGoogleLogin}
                                onError={() => toast.error("Google Login Failed")}
                            />
                        </Box>
                    </Stack>

                    {/* Links Section */}
                    <Stack
                        mt={1}
                        width="100%"
                        alignItems="flex-start"
                    >

                        {/* Already a member */}
                        <MotionConfig whileHover={{ x: 2 }} whileTap={{ scale: 1.05 }}>
                            <motion.div>
                                <Typography
                                    sx={{ textDecoration: 'none', color: 'text.primary' }}
                                    to={'/signup'}
                                    component={Link}
                                >
                                    Don't have an account?{' '}
                                    <span style={{ color: theme.palette.primary.dark }}>Register</span>
                                </Typography>
                            </motion.div>

                            {/* Forgot Password BELOW */}
                            <motion.div style={{ marginTop: '0.5rem' }}>
                                <Typography
                                    sx={{ textDecoration: 'none', color: 'text.warning' }}
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