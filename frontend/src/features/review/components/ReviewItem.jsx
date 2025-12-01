import { Button, IconButton, Menu, MenuItem, Rating, Stack, TextField, Typography, useMediaQuery, useTheme, Card, Avatar, Chip, Box, alpha } from '@mui/material'
import React, { useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useDispatch, useSelector } from 'react-redux';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { deleteReviewByIdAsync, updateReviewByIdAsync } from '../ReviewSlice'
import { useForm } from "react-hook-form"
import { LoadingButton } from '@mui/lab'
import { motion } from "framer-motion";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export const ReviewItem = ({ id, username, userid, comment, rating, createdAt }) => {

    const dispatch = useDispatch()
    const loggedInUser = useSelector(selectLoggedInUser)
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [edit, setEdit] = useState(false)
    const [editRating, setEditRating] = useState(rating)
    const theme = useTheme()
    const is480 = useMediaQuery(theme.breakpoints.down(480))

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const deleteReview = () => {
        dispatch(deleteReviewByIdAsync(id))
        handleClose()
    }

    const handleUpdateReview = (data) => {
        const update = { ...data, _id: id, rating: editRating }
        dispatch(updateReviewByIdAsync(update))
        setEdit(false)
    }

    const isOwnReview = userid && loggedInUser?._id && userid === loggedInUser._id;

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (date) => {
        const reviewDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - reviewDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return reviewDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Card
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: edit ? 'primary.main' : 'divider',
                    boxShadow: edit ? 2 : 1,
                }
            }}
        >
            <Stack spacing={2}>

                {/* Header: Avatar, Name, Rating, Date, Actions */}
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='flex-start'
                    spacing={2}
                >

                    <Stack direction='row' spacing={2} sx={{ flex: 1 }}>
                        {/* Avatar */}
                        <Avatar
                            sx={{
                                bgcolor: 'primary.main',
                                width: { xs: 40, md: 48 },
                                height: { xs: 40, md: 48 },
                                fontSize: { xs: '0.9rem', md: '1rem' },
                                fontWeight: 600
                            }}
                        >
                            {getInitials(username)}
                        </Avatar>

                        {/* User Info & Rating */}
                        <Stack spacing={0.5} sx={{ flex: 1 }}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                spacing={{ xs: 0.5, sm: 2 }}
                            >
                                <Typography variant='subtitle1' fontWeight={600}>
                                    {username}
                                </Typography>

                                {isOwnReview && (
                                    <Chip
                                        label="You"
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.7rem',
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                            fontWeight: 600
                                        }}
                                    />
                                )}
                            </Stack>

                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                spacing={{ xs: 0.5, sm: 2 }}
                            >
                                <motion.div whileHover={{ scale: edit ? 1.05 : 1 }}>
                                    <Rating
                                        size={edit ? (is480 ? 'medium' : 'large') : 'small'}
                                        readOnly={!edit}
                                        value={edit ? editRating : rating}
                                        onChange={(event, newValue) => setEditRating(newValue)}
                                        sx={{ color: 'primary.main' }}
                                    />
                                </motion.div>

                                <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    fontWeight={500}
                                >
                                    {formatDate(createdAt)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>

                    {/* Actions Menu */}
                    {isOwnReview && (
                        <Box>
                            <IconButton
                                aria-controls={open ? 'review-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                onClick={handleClick}
                                size="small"
                                sx={{
                                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.grey[500], 0.15),
                                    }
                                }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>

                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                PaperProps={{
                                    elevation: 3,
                                    sx: {
                                        borderRadius: 2,
                                        minWidth: 140
                                    }
                                }}
                            >
                                <MenuItem
                                    onClick={() => { setEdit(true); handleClose() }}
                                    sx={{ py: 1.5 }}
                                >
                                    <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
                                    Edit
                                </MenuItem>
                                <MenuItem
                                    onClick={deleteReview}
                                    sx={{ py: 1.5, color: 'error.main' }}
                                >
                                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
                                    Delete
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}
                </Stack>

                {/* Review Content */}
                <Stack spacing={2}>
                    {edit ? (
                        <Stack
                            component='form'
                            noValidate
                            onSubmit={handleSubmit(handleUpdateReview)}
                            spacing={2}
                        >
                            <TextField
                                multiline
                                rows={4}
                                {...register("comment", { required: true, value: comment })}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    }
                                }}
                            />

                            <Stack
                                direction='row'
                                spacing={2}
                                justifyContent='flex-end'
                            >
                                <Button
                                    variant='outlined'
                                    size='small'
                                    onClick={() => setEdit(false)}
                                    startIcon={<CloseIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 1.5,
                                        px: 2,
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </Button>
                                <LoadingButton
                                    size='small'
                                    type='submit'
                                    variant='contained'
                                    startIcon={<CheckIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 1.5,
                                        px: 2,
                                        fontWeight: 600
                                    }}
                                >
                                    Update
                                </LoadingButton>
                            </Stack>
                        </Stack>
                    ) : (
                        <Typography
                            variant='body1'
                            color='text.secondary'
                            sx={{
                                lineHeight: 1.7,
                                pl: { xs: 0, md: 7 }
                            }}
                        >
                            {comment}
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </Card>
    )
}