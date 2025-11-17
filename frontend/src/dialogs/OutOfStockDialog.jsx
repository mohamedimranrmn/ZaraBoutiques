import {
    Dialog,
    DialogContent,
    Button,
    Typography,
    Box,
    Stack,
    alpha,
    useTheme
} from "@mui/material";
import { PackageX } from "lucide-react";

export const OutOfStockDialog = ({ open, onClose, onRemove }) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxWidth: 420,
                    width: "90%",
                    p: 1,
                }
            }}
        >
            <DialogContent
                sx={{
                    textAlign: "center",
                    py: 3.5,
                    px: 2.5
                }}
            >
                {/* Icon bubble */}
                <Box
                    sx={{
                        width: 65,
                        height: 65,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.error.main, 0.12),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px"
                    }}
                >
                    <PackageX size={32} color={theme.palette.error.main} />
                </Box>

                {/* Title */}
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: "text.primary"
                    }}
                >
                    Product Out of Stock
                </Typography>

                {/* Subtitle */}
                <Typography
                    variant="body2"
                    sx={{
                        color: "text.secondary",
                        mb: 3,
                        lineHeight: 1.6
                    }}
                >
                    This product is currently unavailable.
                    Would you like to remove it from your cart?
                </Typography>

                {/* Action Buttons */}
                <Stack spacing={1.5}>
                    <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        onClick={onRemove}
                        sx={{
                            textTransform: "none",
                            py: 1.2,
                            borderRadius: 2,
                            fontWeight: 600
                        }}
                    >
                        Remove from Cart
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
