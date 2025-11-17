import SwipeableViews from "react-swipeable-views-react-18-fix";
import { autoPlay } from "react-swipeable-views-utils-react-18-fix";
import { Box, MobileStepper, useTheme } from "@mui/material";
import { useState } from "react";

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

export const ProductBanner = ({ images }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);

    // Aspect ratio for 1693 × 664 (approx 2.55:1)
    const ASPECT_RATIO = 664 / 1693; // height = width * this

    return (
        <Box sx={{ width: "100%", position: "relative" }}>
            {/* Wrapper with fixed aspect ratio */}
            <Box
                sx={{
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        paddingTop: `${ASPECT_RATIO * 100}%`, // maintain perfect image ratio
                        position: "relative",
                    }}
                />

                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <AutoPlaySwipeableViews
                        index={activeStep}
                        onChangeIndex={setActiveStep}
                        enableMouseEvents
                        style={{ height: "100%" }}
                        slideStyle={{ height: "100%" }}
                        interval={3500}
                    >
                        {images.map((img, i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={img}
                                    alt="Banner"
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover", // show full banner always
                                    }}
                                />
                            </Box>
                        ))}
                    </AutoPlaySwipeableViews>
                </Box>
            </Box>

            {/* Dots Navigation */}
            <MobileStepper
                variant="dots"
                steps={images.length}
                position="static"
                activeStep={activeStep}
                sx={{
                    mt: 1,
                    justifyContent: "center",
                    background: "transparent",
                    "& .MuiMobileStepper-dot": {
                        backgroundColor: "rgba(255,255,255,0.5)",
                    },
                    "& .MuiMobileStepper-dotActive": {
                        backgroundColor: "#1976d2",
                    },
                }}
            />
        </Box>
    );
};
