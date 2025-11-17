import { Box, IconButton, TextField, Typography, useMediaQuery, useTheme, Divider } from '@mui/material'
import { Stack } from '@mui/material'
import React from 'react'
import { facebookPng, instagramPng, twitterPng, linkedinPng } from '../../assets'
import SendIcon from '@mui/icons-material/Send';
import { MotionConfig, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Footer = () => {
    const theme = useTheme()
    const is900 = useMediaQuery(theme.breakpoints.down(900))
    const is600 = useMediaQuery(theme.breakpoints.down(600))

    const labelStyles = {
        fontWeight: 400,
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'color 0.3s ease',
        '&:hover': {
            color: '#FF4444'
        }
    }

    const sectionTitleStyles = {
        fontWeight: 600,
        fontSize: '1.1rem',
        mb: 2,
        letterSpacing: '0.5px'
    }

    return (
        <Stack sx={{
            backgroundColor: '#000000',
            paddingTop: "4rem",
            paddingLeft: is600 ? "1.5rem" : is900 ? "2rem" : "5rem",
            paddingRight: is600 ? "1.5rem" : is900 ? "2rem" : "5rem",
            paddingBottom: "2rem",
            color: '#FFFFFF',
        }}>

            {/* Main Content */}
            <Stack
                flexDirection={is900 ? 'column' : 'row'}
                justifyContent="space-between"
                alignItems={is900 ? 'flex-start' : 'flex-start'}
                gap={is900 ? 4 : 6}
                mb={4}
            >
                {/* Support Section */}
                <Stack
                    rowGap={1.5}
                    flex={is900 ? 'none' : 1}
                    maxWidth={is900 ? '100%' : '250px'}
                >
                    <Typography variant='h6' sx={sectionTitleStyles}>
                        Contact Us
                    </Typography>
                    <Typography sx={{ ...labelStyles, color: '#B3B3B3' }}>
                        Zee Corner, Sadukkai Street,<br />Kayalpaytnam
                    </Typography>
                    <Typography sx={{ ...labelStyles, color: '#B3B3B3' }}>
                        zeeboutiques.noreply@gmail.com
                    </Typography>
                    <Typography sx={{ ...labelStyles, color: '#B3B3B3' }}>
                        +91 86104 33939
                    </Typography>
                </Stack>

                {/* Account Section */}
                {/* Account Section */}
                <Stack
                    rowGap={1.5}
                    flex={is900 ? 'none' : 1}
                    maxWidth={is900 ? '100%' : '200px'}
                >
                    <Typography variant='h6' sx={sectionTitleStyles}>
                        Account
                    </Typography>

                    <Typography
                        component={Link}
                        to="/profile"
                        sx={{ ...labelStyles, textDecoration: 'none', color: '#FFFFFF' }}
                    >
                        My Account
                    </Typography>

                    <Typography
                        component={Link}
                        to="/cart"
                        sx={{ ...labelStyles, textDecoration: 'none', color: '#FFFFFF' }}
                    >
                        Cart
                    </Typography>

                    <Typography
                        component={Link}
                        to="/wishlist"
                        sx={{ ...labelStyles, textDecoration: 'none', color: '#FFFFFF' }}
                    >
                        Wishlist
                    </Typography>
                </Stack>


                {/* Social Media Section */}
                <Stack
                    rowGap={2}
                    flex={is900 ? 'none' : 1}
                    maxWidth={is900 ? '100%' : '200px'}
                >
                    <Typography variant='h6' sx={sectionTitleStyles}>
                        Follow Us
                    </Typography>
                    <Typography sx={{ color: '#B3B3B3', fontSize: '0.9rem', mb: 1 }}>
                        Stay connected with us on social media
                    </Typography>
                    <Stack flexDirection={'row'} gap={2} alignItems={'center'}>
                        <motion.a
                            href="https://www.facebook.com/profile.php?id=61557563411136"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.2, y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ display: 'flex' }}
                        >
                            <Box sx={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#1877F2',
                                borderRadius: '50%',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: '#1565D8',
                                    boxShadow: '0 4px 12px rgba(24, 119, 242, 0.4)'
                                }
                            }}>
                                <img
                                    style={{ width: '20px', height: '20px' }}
                                    src={facebookPng}
                                    alt="Facebook"
                                />
                            </Box>
                        </motion.a>

                        <motion.a
                            href="https://www.instagram.com/mohamedimranrmn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.2, y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ display: 'flex' }}
                        >
                            <Box sx={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
                                borderRadius: '50%',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #F77737, #E23F7E, #8E3BB8, #5A63DB)',
                                    boxShadow: '0 4px 12px rgba(228, 64, 95, 0.4)'
                                }
                            }}>
                                <img
                                    style={{ width: '20px', height: '20px' }}
                                    src={instagramPng}
                                    alt="Instagram"
                                />
                            </Box>
                        </motion.a>
                    </Stack>
                </Stack>

            </Stack>

            {/* Divider */}
            <Divider sx={{ backgroundColor: '#333333', my: 3 }} />

            {/* Copyright Section */}
            <Stack alignItems={"center"}>
                <Typography
                    sx={{
                        color: '#666666',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}
                >
                    &copy; {new Date().getFullYear()} mohamedimranrmn. All rights reserved
                </Typography>
            </Stack>

        </Stack>
    )
}