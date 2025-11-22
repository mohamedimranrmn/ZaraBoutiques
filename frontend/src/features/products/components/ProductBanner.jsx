import SwipeableViews from "react-swipeable-views-react-18-fix";
import { autoPlay } from "react-swipeable-views-utils-react-18-fix";
import { Box, MobileStepper } from "@mui/material";
import { useState } from "react";

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

export const ProductBanner = ({ images }) => {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <Box
            sx={{
                width: "100%",
                overflow: "hidden",      // Prevent horizontal scroll
                position: "relative",
            }}
        >
            <AutoPlaySwipeableViews
                index={activeStep}
                onChangeIndex={setActiveStep}
                enableMouseEvents
                interval={4000}
                style={{ width: "100%" }}
                slideStyle={{ width: "100%" }}
            >
                {images.map((img, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            bgcolor: "#f5f5f5",
                        }}
                    >
                        <Box
                            component="img"
                            src={img}
                            alt={`banner-${i}`}
                            loading={i === 0 ? "eager" : "lazy"}
                            sx={{
                                width: "100%",
                                height: "auto",
                                maxHeight: { xs: "300px", sm: "450px", md: "550px" },
                                objectFit: "contain",  // Prevent cropping
                                display: "block",
                            }}
                        />
                    </Box>
                ))}
            </AutoPlaySwipeableViews>

            {/* DOTS */}
            <MobileStepper
                variant="dots"
                steps={images.length}
                position="static"
                activeStep={activeStep}
                sx={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 10,
                    px: 2,
                    py: 1,
                    "& .MuiMobileStepper-dot": {
                        backgroundColor: "rgba(255,255,255,0.5)",
                    },
                    "& .MuiMobileStepper-dotActive": {
                        backgroundColor: "#fff",
                    },
                }}
            />
        </Box>
    );
};
