import React, { useEffect, useState, useCallback } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Button,
    Box,
    Stack,
    TextField,
    alpha,
    useTheme,
    useMediaQuery
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import VerifiedIcon from "@mui/icons-material/Verified";

import {
    auth,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "../firebase/client";

const OTPDialog = ({ open, phone, onVerified, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");

    // RESET ON CLOSE
    useEffect(() => {
        if (!open) {
            setOtpSent(false);
            setOtp("");
            setError("");
            setIsSending(false);
            setIsVerifying(false);
            setConfirmationResult(null);

            // Clean up reCAPTCHA
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.log('reCAPTCHA clear error:', e);
                }
                window.recaptchaVerifier = null;
            }
        }
    }, [open]);

    // CREATE RECAPTCHA - Let Firebase handle it automatically
    const setupRecaptcha = useCallback(() => {
        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(
                    auth,
                    "recaptcha-container",
                    {
                        size: "invisible",
                        callback: (response) => {
                            console.log('reCAPTCHA solved successfully');
                        },
                        'expired-callback': () => {
                            console.log('reCAPTCHA expired');
                            setError('Verification expired. Please try again.');
                            setIsSending(false);
                        }
                    }
                );
            }
            return true;
        } catch (e) {
            console.error('reCAPTCHA setup error:', e);
            setError('Failed to initialize verification. Please refresh the page.');
            return false;
        }
    }, []);

    // SEND OTP
    const handleSendOTP = async () => {
        try {
            setError("");
            setIsSending(true);

            // Validate phone number
            if (!phone || phone.length !== 10) {
                setError("Please enter a valid 10-digit phone number.");
                setIsSending(false);
                return;
            }

            // Setup reCAPTCHA
            const recaptchaReady = setupRecaptcha();
            if (!recaptchaReady) {
                setIsSending(false);
                return;
            }

            const appVerifier = window.recaptchaVerifier;

            // Send OTP via Firebase
            const result = await signInWithPhoneNumber(
                auth,
                `+91${phone}`,
                appVerifier
            );

            setConfirmationResult(result);
            setOtpSent(true);
            console.log('OTP sent successfully to +91' + phone);

        } catch (e) {
            console.error("OTP send error:", e);

            // Handle specific Firebase errors
            let errorMessage = "Failed to send OTP. Please try again.";

            if (e.code === 'auth/invalid-phone-number') {
                errorMessage = "Invalid phone number format.";
            } else if (e.code === 'auth/quota-exceeded') {
                errorMessage = "SMS quota exceeded. Please try again later.";
            } else if (e.code === 'auth/too-many-requests') {
                errorMessage = "Too many attempts. Please try again after some time.";
            } else if (e.code === 'auth/unauthorized-domain') {
                errorMessage = "This domain is not authorized. Please contact support.";
            } else if (e.code === 'auth/captcha-check-failed') {
                errorMessage = "reCAPTCHA verification failed. Please try again.";
            }

            setError(errorMessage);

            // Clear reCAPTCHA to allow retry
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (clearError) {
                    console.log('Error clearing reCAPTCHA:', clearError);
                }
            }
        } finally {
            setIsSending(false);
        }
    };

    // VERIFY OTP
    const handleVerifyOtp = async () => {
        try {
            if (!otp || otp.length !== 6) {
                setError("Please enter a valid 6-digit OTP.");
                return;
            }

            if (!confirmationResult) {
                setError("Session expired. Please request a new OTP.");
                return;
            }

            setIsVerifying(true);
            setError("");

            // Confirm OTP with Firebase
            const cred = await confirmationResult.confirm(otp);
            const idToken = await cred.user.getIdToken();

            console.log('Phone verification successful');
            onVerified(idToken); // Pass token to parent

        } catch (e) {
            console.error("OTP verify error:", e);

            let errorMessage = "Incorrect OTP. Please try again.";

            if (e.code === 'auth/invalid-verification-code') {
                errorMessage = "Invalid OTP code. Please check and try again.";
            } else if (e.code === 'auth/code-expired') {
                errorMessage = "OTP expired. Please request a new one.";
            } else if (e.code === 'auth/session-expired') {
                errorMessage = "Session expired. Please request a new OTP.";
            }

            setError(errorMessage);
            setIsVerifying(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isVerifying) {
            handleVerifyOtp();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
                Verify Phone Number

                <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 3 }}>
                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" />

                {!otpSent ? (
                    // SEND OTP VIEW
                    <Stack spacing={3} alignItems="center">
                        <Box
                            sx={{
                                width: "100%",
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                textAlign: "center"
                            }}
                        >
                            <Typography variant="body2" mb={1} color="text.secondary">
                                We'll send a verification code to:
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                color="primary.main"
                            >
                                +91 {phone}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            disabled={isSending}
                            onClick={handleSendOTP}
                            sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem' }}
                        >
                            {isSending ? "Sending OTP..." : "Send OTP"}
                        </Button>

                        {error && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    borderRadius: 1,
                                    width: '100%'
                                }}
                            >
                                <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
                                    {error}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                ) : (
                    // VERIFY OTP VIEW
                    <Stack spacing={3} alignItems="center">
                        {isVerifying ? (
                            <>
                                <VerifiedIcon sx={{ fontSize: 56, color: "success.main" }} />
                                <Typography variant="h6" fontWeight={600}>
                                    Verifying...
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Please wait while we verify your code
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Enter Verification Code
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        We've sent a 6-digit code to
                                    </Typography>
                                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                                        +91 {phone}
                                    </Typography>
                                </Box>

                                <TextField
                                    label="Enter OTP"
                                    fullWidth
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setOtp(value);
                                    }}
                                    onKeyPress={handleKeyPress}
                                    inputProps={{
                                        maxLength: 6,
                                        inputMode: "numeric",
                                        pattern: "[0-9]*",
                                        style: {
                                            fontSize: '1.5rem',
                                            textAlign: 'center',
                                            letterSpacing: '0.5rem'
                                        }
                                    }}
                                    autoFocus
                                    placeholder="000000"
                                />

                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleVerifyOtp}
                                    disabled={otp.length !== 6}
                                    sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem' }}
                                >
                                    Verify & Continue
                                </Button>

                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Didn't receive code?
                                    </Typography>
                                    <Button
                                        variant="text"
                                        disabled={isSending}
                                        onClick={handleSendOTP}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 600,
                                            minWidth: 'auto',
                                            px: 1
                                        }}
                                    >
                                        {isSending ? "Resending..." : "Resend"}
                                    </Button>
                                </Stack>

                                {error && (
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            borderRadius: 1,
                                            width: '100%'
                                        }}
                                    >
                                        <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
                                            {error}
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        )}
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default OTPDialog;