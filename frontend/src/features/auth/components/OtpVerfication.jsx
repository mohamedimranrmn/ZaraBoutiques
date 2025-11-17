import { Button, FormHelperText, Stack, TextField, Typography, Box, useMediaQuery, useTheme } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearOtpVerificationError, clearResendOtpError, clearResendOtpSuccessMessage, resendOtpAsync, resetOtpVerificationStatus, resetResendOtpStatus, selectLoggedInUser, selectOtpVerificationError, selectOtpVerificationStatus, selectResendOtpError, selectResendOtpStatus, selectResendOtpSuccessMessage, verifyOtpAsync } from '../AuthSlice'
import { LoadingButton } from '@mui/lab'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Lottie from 'lottie-react'
import { motion } from 'framer-motion'
import { orderSuccessAnimation } from '../../../assets'

export const OtpVerfication = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [otpError, setOtpError] = useState('')
    const inputRefs = useRef([])

    const dispatch = useDispatch()
    const loggedInUser = useSelector(selectLoggedInUser)
    const navigate = useNavigate()
    const resendOtpStatus = useSelector(selectResendOtpStatus)
    const resendOtpError = useSelector(selectResendOtpError)
    const resendOtpSuccessMessage = useSelector(selectResendOtpSuccessMessage)
    const otpVerificationStatus = useSelector(selectOtpVerificationStatus)
    const otpVerificationError = useSelector(selectOtpVerificationError)

    const theme = useTheme()
    const is900 = useMediaQuery(theme.breakpoints.down(900))
    const is480 = useMediaQuery(theme.breakpoints.down(480))

    // handles the redirection
    useEffect(() => {
        if (!loggedInUser) {
            navigate('/login')
        }
        else if (loggedInUser && loggedInUser?.isVerified) {
            navigate("/")
        }
    }, [loggedInUser])

    const handleSendOtp = () => {
        const data = { user: loggedInUser?._id }
        dispatch(resendOtpAsync(data))
    }

    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        setOtpError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '')

        if (pastedData.length !== 6) {
            setOtpError('Please paste a valid 6-digit OTP')
            return
        }

        const newOtp = pastedData.split('')
        setOtp(newOtp)
        setOtpError('')
        inputRefs.current[5]?.focus()
    }

    const handleVerifyOtp = () => {
        const otpString = otp.join('')

        if (otpString.length !== 6) {
            setOtpError('Please enter a 6-digit OTP')
            return
        }

        const cred = { otp: otpString, userId: loggedInUser?._id }
        dispatch(verifyOtpAsync(cred))
    }

    // handles resend otp error
    useEffect(() => {
        if (resendOtpError) {
            toast.error(resendOtpError.message)
        }
        return () => {
            dispatch(clearResendOtpError())
        }
    }, [resendOtpError])

    // handles resend otp success message
    useEffect(() => {
        if (resendOtpSuccessMessage) {
            toast.success(resendOtpSuccessMessage.message)
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
        }
        return () => {
            dispatch(clearResendOtpSuccessMessage())
        }
    }, [resendOtpSuccessMessage])

    // handles error while verifying otp
    useEffect(() => {
        if (otpVerificationError) {
            toast.error(otpVerificationError.message)
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        }
        return () => {
            dispatch(clearOtpVerificationError())
        }
    }, [otpVerificationError])

    useEffect(() => {
        if (otpVerificationStatus === 'fullfilled') {
            toast.success("Email verified! We are happy to have you here")
            dispatch(resetResendOtpStatus())
        }
        return () => {
            dispatch(resetOtpVerificationStatus())
        }
    }, [otpVerificationStatus])

    // Auto-submit when all digits are entered
    useEffect(() => {
        if (otp.every(digit => digit !== '') && resendOtpStatus === 'fullfilled') {
            handleVerifyOtp()
        }
    }, [otp])

    return (
        <Stack
            width={'100vw'}
            minHeight={'100vh'}
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
                        animationData={orderSuccessAnimation}
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
                sx={{
                    py: is900 ? 4 : 0,
                    px: 2
                }}
            >
                {resendOtpStatus === 'fullfilled' ? (
                    <Stack
                        spacing={3}
                        width={is480 ? '95vw' : '28rem'}
                        alignItems={'center'}
                    >
                        {/* Brand Header */}
                        <Stack rowGap={'.4rem'} alignItems={'center'}>
                            <Typography
                                variant={is480 ? 'h4' : 'h3'}
                                fontWeight={700}
                                textAlign={'center'}
                                sx={{
                                    wordBreak: 'break-word',
                                    background: 'linear-gradient(45deg, #000000 30%, #DB4444 90%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                VERIFY EMAIL
                            </Typography>
                            <Typography
                                color={'GrayText'}
                                variant='body2'
                                textAlign={'center'}
                                sx={{ fontWeight: 400 }}
                            >
                                Enter verification code
                            </Typography>
                        </Stack>

                        <Stack alignItems={'center'} spacing={0.5}>
                            <Typography
                                textAlign={'center'}
                                variant='body2'
                                color={'text.secondary'}
                            >
                                Enter the 6-digit code sent to
                            </Typography>
                            <Typography
                                fontWeight={600}
                                variant='body2'
                                sx={{
                                    wordBreak: 'break-word',
                                    textAlign: 'center',
                                    color: '#DB4444'
                                }}
                            >
                                {loggedInUser?.email}
                            </Typography>
                        </Stack>

                        {/* OTP Input */}
                        <Stack
                            direction={'row'}
                            spacing={is480 ? 1 : 1.5}
                            justifyContent={'center'}
                            width={'100%'}
                        >
                            {otp.map((digit, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <TextField
                                        inputRef={(ref) => (inputRefs.current[index] = ref)}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        inputProps={{
                                            maxLength: 1,
                                            style: {
                                                textAlign: 'center',
                                                fontSize: is480 ? '18px' : '22px',
                                                fontWeight: 600,
                                                padding: 0,
                                                color: '#1a1a1a'
                                            }
                                        }}
                                        sx={{
                                            width: is480 ? '42px' : '52px',
                                            '& .MuiOutlinedInput-root': {
                                                height: is480 ? '50px' : '60px',
                                                backgroundColor: '#fafafa',
                                                borderRadius: '8px',
                                                '& fieldset': {
                                                    borderColor: '#e0e0e0',
                                                    borderWidth: '1px'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#DB4444',
                                                },
                                                '&.Mui-focused': {
                                                    backgroundColor: '#ffffff',
                                                    '& fieldset': {
                                                        borderWidth: '2px',
                                                        borderColor: '#DB4444'
                                                    }
                                                }
                                            }
                                        }}
                                        error={!!otpError}
                                    />
                                </motion.div>
                            ))}
                        </Stack>

                        {otpError && (
                            <FormHelperText sx={{ color: '#DB4444', textAlign: 'center' }}>
                                {otpError}
                            </FormHelperText>
                        )}

                        <motion.div
                            style={{ width: '100%' }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                        >
                            <LoadingButton
                                loading={otpVerificationStatus === 'pending'}
                                onClick={handleVerifyOtp}
                                fullWidth
                                variant='contained'
                                sx={{
                                    height: '2.5rem',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    backgroundColor: '#DB4444',
                                    '&:hover': {
                                        backgroundColor: '#b73535'
                                    }
                                }}
                            >
                                Verify Email
                            </LoadingButton>
                        </motion.div>

                        <Stack direction={'row'} spacing={0.5} alignItems={'center'} justifyContent={'center'} flexWrap={'wrap'}>
                            <Typography variant='body2' color={'text.secondary'}>
                                Didn't receive the code?
                            </Typography>
                            <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 1.05 }}>
                                <Button
                                    onClick={handleSendOtp}
                                    disabled={resendOtpStatus === 'pending'}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        p: 0.5,
                                        minWidth: 'auto',
                                        color: '#DB4444',
                                        '&:hover': {
                                            bgcolor: 'transparent',
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    Resend
                                </Button>
                            </motion.div>
                        </Stack>
                    </Stack>
                ) : (
                    <Stack
                        spacing={3}
                        width={is480 ? '95vw' : '28rem'}
                        alignItems={'center'}
                    >
                        {/* Brand Header */}
                        <Stack rowGap={'.4rem'} alignItems={'center'}>
                            <Typography
                                variant={is480 ? 'h4' : 'h3'}
                                fontWeight={700}
                                textAlign={'center'}
                                sx={{
                                    wordBreak: 'break-word',
                                    background: 'linear-gradient(45deg, #000000 30%, #DB4444 90%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                EMAIL VERIFICATION
                            </Typography>
                            <Typography
                                color={'GrayText'}
                                variant='body2'
                                textAlign={'center'}
                                sx={{ fontWeight: 400 }}
                            >
                                Secure your account
                            </Typography>
                        </Stack>

                        <Stack alignItems={'center'} textAlign={'center'} spacing={0.5}>
                            <Typography variant='body2' color={'text.secondary'}>
                                We'll send you a verification code to
                            </Typography>
                            <Typography
                                fontWeight={600}
                                variant='body2'
                                sx={{
                                    wordBreak: 'break-word',
                                    color: '#DB4444'
                                }}
                            >
                                {loggedInUser?.email}
                            </Typography>
                        </Stack>

                        <motion.div
                            style={{ width: '100%' }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                        >
                            <LoadingButton
                                onClick={handleSendOtp}
                                loading={resendOtpStatus === 'pending'}
                                fullWidth
                                variant='contained'
                                sx={{
                                    height: '2.5rem',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    backgroundColor: '#DB4444',
                                    '&:hover': {
                                        backgroundColor: '#b73535'
                                    }
                                }}
                            >
                                Send Verification Code
                            </LoadingButton>
                        </motion.div>
                    </Stack>
                )}
            </Stack>
        </Stack>
    )
}