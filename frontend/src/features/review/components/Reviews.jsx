import { Button, IconButton, LinearProgress, Rating, Stack, TextField, Typography, useMediaQuery, Box, Card, Avatar, Chip, Divider, alpha } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createReviewAsync, resetReviewAddStatus, resetReviewDeleteStatus, resetReviewUpdateStatus, selectReviewAddStatus, selectReviewDeleteStatus, selectReviewStatus, selectReviewUpdateStatus, selectReviews } from '../ReviewSlice'
import { ReviewItem } from './ReviewItem'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import {toast} from 'react-toastify'
import CreateIcon from '@mui/icons-material/Create';
import {MotionConfig, motion} from 'framer-motion'
import { useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';

export const Reviews = ({productId,averageRating}) => {

    const dispatch=useDispatch()
    const reviews=useSelector(selectReviews)
    const [value,setValue]=useState(1)
    const {register,handleSubmit,reset,formState: { errors }} = useForm()
    const loggedInUser=useSelector(selectLoggedInUser)
    const reviewStatus=useSelector(selectReviewStatus)
    const ref=useRef(null)

    const reviewAddStatus=useSelector(selectReviewAddStatus)
    const reviewDeleteStatus=useSelector(selectReviewDeleteStatus)
    const reviewUpdateStatus=useSelector(selectReviewUpdateStatus)

    const [writeReview,setWriteReview]=useState(false)
    const theme=useTheme()

    const is840=useMediaQuery(theme.breakpoints.down(840))
    const is480=useMediaQuery(theme.breakpoints.down(480))

    useEffect(()=>{

        if(reviewAddStatus==='fulfilled'){
            toast.success("Review added")
        }
        else if(reviewAddStatus==='rejected'){
            toast.error("Error posting review, please try again later")
        }

        reset()
        setValue(1)

    },[reviewAddStatus])

    useEffect(()=>{

        if(reviewDeleteStatus==='fulfilled'){
            toast.success("Review deleted")
        }
        else if(reviewDeleteStatus==='rejected'){
            toast.error("Error deleting review, please try again later")
        }
    },[reviewDeleteStatus])

    useEffect(()=>{

        if(reviewUpdateStatus==='fulfilled'){
            toast.success("Review updated")
        }
        else if(reviewUpdateStatus==='rejected'){
            toast.error("Error updating review, please try again later")
        }
    },[reviewUpdateStatus])

    useEffect(()=>{
        return ()=>{
            dispatch(resetReviewAddStatus())
            dispatch(resetReviewDeleteStatus())
            dispatch(resetReviewUpdateStatus())
        }
    },[])

    const ratingCounts={
        5:0,
        4:0,
        3:0,
        2:0,
        1:0
    }

    reviews.map((review)=>{
        ratingCounts[review.rating]=ratingCounts[review.rating]+1
    })


    const handleAddReview=(data)=>{
        const review={...data,rating:value,user:loggedInUser._id,product:productId}
        dispatch(createReviewAsync(review))
        setWriteReview(false)
    }



    return (
        <Box sx={{ width: '100%', maxWidth: is480 ? '90vw' : is840 ? '100%' : '100%' }}>

            {/* Header Section */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                sx={{ mb: 4 }}
            >
                <Typography variant='h5' fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RateReviewIcon /> Customer Reviews
                </Typography>
            </Stack>

            {/* Reviews Summary Card */}
            {reviews?.length > 0 && (
                <Card
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 4 },
                        mb: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={4}
                        divider={<Divider orientation={is840 ? 'horizontal' : 'vertical'} flexItem />}
                    >

                        {/* Overall Rating */}
                        <Stack spacing={1.5} alignItems={{ xs: 'center', md: 'flex-start' }} sx={{ minWidth: { md: 200 } }}>
                            <Typography variant='h2' fontWeight={700} color="primary.main">
                                {averageRating}.0
                            </Typography>
                            <Rating
                                value={averageRating}
                                readOnly
                                size="large"
                                sx={{ color: 'primary.main' }}
                            />
                            <Typography variant='body2' color='text.secondary' fontWeight={500}>
                                Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                            </Typography>
                        </Stack>

                        {/* Rating Distribution */}
                        <Stack spacing={2} sx={{ flex: 1 }}>
                            {[5, 4, 3, 2, 1].map((number) => {
                                const percentage = reviews.length > 0 ? (ratingCounts[number] / reviews.length) * 100 : 0;
                                const count = ratingCounts[number];
                                return (
                                    <Stack
                                        key={number}
                                        direction='row'
                                        alignItems='center'
                                        spacing={2}
                                    >
                                        {/* Star Rating Display */}
                                        <Box sx={{ minWidth: 80 }}>
                                            <Rating
                                                value={number}
                                                readOnly
                                                size="small"
                                                max={5}
                                                sx={{
                                                    '& .MuiRating-icon': {
                                                        fontSize: { xs: '1rem', md: '1.1rem' }
                                                    },
                                                    '& .MuiRating-iconFilled': {
                                                        color: '#FFB400'
                                                    },
                                                    '& .MuiRating-iconEmpty': {
                                                        color: alpha('#FFB400', 0.15)
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Progress Bar */}
                                        <Box
                                            sx={{
                                                flex: 1,
                                                position: 'relative',
                                                height: 10,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.grey[400], 0.12),
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    height: '100%',
                                                    width: `${percentage}%`,
                                                    bgcolor: number >= 4 ? '#FFB400' : number >= 3 ? '#FFA726' : '#FF9800',
                                                    borderRadius: 2,
                                                    transition: 'width 0.6s ease-in-out'
                                                }}
                                            />
                                        </Box>

                                        {/* Percentage & Count */}
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={1}
                                            sx={{ minWidth: 70 }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                sx={{ minWidth: 38, textAlign: 'right' }}
                                            >
                                                {Math.round(percentage)}%
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ minWidth: 25 }}
                                            >
                                                ({count})
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Stack>
                </Card>
            )}

            {/* Empty State */}
            {!reviews?.length && (
                <Card
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}
                >
                    <RateReviewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant='h6' color='text.secondary' fontWeight={500}>
                        {loggedInUser?.isAdmin
                            ? "There are no reviews currently"
                            : "Be the first to review this product"}
                    </Typography>
                </Card>
            )}

            {/* Write Review Button */}
            {!loggedInUser?.isAdmin && !writeReview && (
                <Box sx={{ mb: 4 }}>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={() => setWriteReview(true)}
                            variant='contained'
                            size={is480 ? 'medium' : 'large'}
                            startIcon={<CreateIcon />}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3,
                                py: 1.5,
                                fontWeight: 600,
                                fontSize: '1rem'
                            }}
                        >
                            Write a Review
                        </Button>
                    </motion.div>
                </Box>
            )}

            {/* Write Review Form */}
            {writeReview && (
                <Card
                    elevation={0}
                    component='form'
                    noValidate
                    onSubmit={handleSubmit(handleAddReview)}
                    sx={{
                        p: { xs: 2.5, md: 3 },
                        mb: 4,
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }}
                >
                    <Stack spacing={3}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant='h6' fontWeight={600}>
                                Share Your Experience
                            </Typography>
                            <IconButton
                                onClick={() => setWriteReview(false)}
                                size="small"
                            >
                                <CloseIcon />
                            </IconButton>
                        </Stack>

                        <Stack spacing={1.5}>
                            <Typography variant='body2' fontWeight={500}>
                                Your Rating
                            </Typography>
                            <motion.div
                                style={{ width: 'fit-content' }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <Rating
                                    size='large'
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    sx={{ color: 'primary.main' }}
                                />
                            </motion.div>
                        </Stack>

                        <Stack spacing={1.5}>
                            <Typography variant='body2' fontWeight={500}>
                                Your Review
                            </Typography>
                            <TextField
                                {...register("comment", { required: true })}
                                multiline
                                rows={5}
                                placeholder='Share your thoughts about this product...'
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    }
                                }}
                            />
                        </Stack>

                        <Stack
                            direction='row'
                            spacing={2}
                            justifyContent='flex-end'
                        >
                            <Button
                                onClick={() => setWriteReview(false)}
                                variant='outlined'
                                size={is480 ? 'medium' : 'large'}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 3,
                                    fontWeight: 600
                                }}
                            >
                                Cancel
                            </Button>
                            <LoadingButton
                                loading={reviewStatus === 'pending'}
                                type='submit'
                                variant='contained'
                                size={is480 ? 'medium' : 'large'}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 3,
                                    fontWeight: 600
                                }}
                            >
                                Post Review
                            </LoadingButton>
                        </Stack>
                    </Stack>
                </Card>
            )}

            {/* Reviews List */}
            {reviews?.length > 0 && (
                <Stack spacing={2.5}>
                    <Typography variant='h6' fontWeight={600}>
                        All Reviews ({reviews.length})
                    </Typography>

                    {reviews.map((review) => {
                        const safeUser = review?.user || {};
                        return (
                            <ReviewItem
                                key={review._id}
                                id={review._id}
                                userid={safeUser._id || null}
                                comment={review.comment}
                                createdAt={review.createdAt}
                                rating={review.rating}
                                username={safeUser.name || "Unknown User"}
                            />
                        );
                    })}
                </Stack>
            )}
        </Box>
    )
}