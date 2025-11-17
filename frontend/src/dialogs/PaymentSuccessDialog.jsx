import React from 'react';
import {
    Dialog,
    Box,
    Typography,
    Stack,
    Button,
    useTheme,
    alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { orderSuccessAnimation } from '../assets';

const PaymentSuccessDialog = ({ open, orderId, onViewOrder }) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: 'transparent',
                    boxShadow: 'none'
                }
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(8px)',
                    bgcolor: alpha(theme.palette.common.black, 0.6)
                }
            }}
        >
            <Box
                sx={{
                    p: 4,
                    bgcolor: 'white',
                    borderRadius: 3,
                    textAlign: 'center'
                }}
            >
                <Stack spacing={3} alignItems="center">

                    {/* Animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{ position: 'relative' }}
                    >
                        <Box sx={{ width: { xs: 200, sm: 250 }, mx: 'auto' }}>
                            <Lottie
                                animationData={orderSuccessAnimation}
                                loop={false}
                            />
                        </Box>

                        {/* Pulse */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '80%',
                                height: '80%',
                                borderRadius: '50%',
                                backgroundColor: alpha(theme.palette.success.main, 0.1),
                                zIndex: -1
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.1, 0.3]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />
                    </motion.div>

                    {/* Success Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        <Stack spacing={1.5}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                color="success.main"
                                sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
                            >
                                Payment Successful!
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            >
                                Your order has been placed successfully
                            </Typography>
                        </Stack>
                    </motion.div>

                    {/* View Order Details Button */}
                    <Button
                        variant="contained"
                        color="success"
                        onClick={onViewOrder}
                        sx={{
                            textTransform: 'none',
                            mt: 1,
                            px: 4,
                            py: 1,
                            borderRadius: 2,
                            fontWeight: 600
                        }}
                    >
                        View Order Details
                    </Button>

                    {/* Confetti */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            style={{
                                position: 'absolute',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: [
                                    theme.palette.success.main,
                                    theme.palette.primary.main,
                                    theme.palette.warning.main,
                                    theme.palette.info.main
                                ][i % 4],
                                top: '50%',
                                left: '50%'
                            }}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                                scale: [0, 1, 1],
                                x: [0, Math.cos(i * 30 * Math.PI / 180) * 100],
                                y: [0, Math.sin(i * 30 * Math.PI / 180) * 100],
                                opacity: [1, 1, 0]
                            }}
                            transition={{
                                duration: 1,
                                delay: 0.2,
                                ease: 'easeOut'
                            }}
                        />
                    ))}
                </Stack>
            </Box>
        </Dialog>
    );
};

export default PaymentSuccessDialog;
