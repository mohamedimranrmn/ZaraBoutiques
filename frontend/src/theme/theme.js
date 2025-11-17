import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: "#000000",
      light: "#ffffff",
      dark: '#DB4444',
      customBlack: "#191919",
      contrastText: '#ffffff',
    },
    secondary: {
      main: "#DB4444",
      light: "#FF6B6B",
      dark: "#B23535",
      contrastText: '#ffffff',
    },
    background: {
      default: "#FFFFFF",
      paper: "#F8F9FA",
    },
    text: {
      primary: "#191919",
      secondary: "#666666",
      disabled: "#999999",
    },
    error: {
      main: "#DC3545",
    },
    warning: {
      main: "#FFC107",
    },
    info: {
      main: "#17A2B8",
    },
    success: {
      main: "#28A745",
    },
    grey: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0",
      400: "#BDBDBD",
      500: "#9E9E9E",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      xxl: 1920,
    },
  },

  spacing: 8, // Base spacing unit

  shape: {
    borderRadius: 12, // Modern rounded corners
  },

  shadows: [
    "none",
    "0px 2px 4px rgba(0,0,0,0.05)",
    "0px 4px 8px rgba(0,0,0,0.08)",
    "0px 8px 16px rgba(0,0,0,0.1)",
    "0px 12px 24px rgba(0,0,0,0.12)",
    "0px 16px 32px rgba(0,0,0,0.14)",
    "0px 20px 40px rgba(0,0,0,0.16)",
    "0px 24px 48px rgba(0,0,0,0.18)",
    "0px 2px 8px rgba(219,68,68,0.15)", // Accent shadow
    "0px 4px 16px rgba(219,68,68,0.2)",
    "0px 8px 24px rgba(219,68,68,0.25)",
    "0px 2px 4px rgba(0,0,0,0.06)",
    "0px 4px 8px rgba(0,0,0,0.09)",
    "0px 8px 16px rgba(0,0,0,0.11)",
    "0px 12px 24px rgba(0,0,0,0.13)",
    "0px 16px 32px rgba(0,0,0,0.15)",
    "0px 20px 40px rgba(0,0,0,0.17)",
    "0px 24px 48px rgba(0,0,0,0.19)",
    "0px 28px 56px rgba(0,0,0,0.21)",
    "0px 32px 64px rgba(0,0,0,0.23)",
    "0px 36px 72px rgba(0,0,0,0.25)",
    "0px 40px 80px rgba(0,0,0,0.27)",
    "0px 44px 88px rgba(0,0,0,0.29)",
    "0px 48px 96px rgba(0,0,0,0.31)",
    "0px 52px 104px rgba(0,0,0,0.33)",
  ],

  typography: {
    fontFamily: "'Poppins', 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    // Display styles for hero sections
    h1: {
      fontSize: "clamp(2.5rem, 8vw, 6rem)",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      background: "linear-gradient(135deg, #000000 0%, #434343 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },

    h2: {
      fontSize: "clamp(2rem, 6vw, 3.75rem)",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
    },

    h3: {
      fontSize: "clamp(1.75rem, 4vw, 3rem)",
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
    },

    h4: {
      fontSize: "clamp(1.5rem, 3vw, 2.125rem)",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "0",
    },

    h5: {
      fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0",
    },

    h6: {
      fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0.01em",
    },

    subtitle1: {
      fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: "0.01em",
    },

    subtitle2: {
      fontSize: "clamp(0.875rem, 1.2vw, 1rem)",
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: "0.01em",
    },

    body1: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      fontWeight: 400,
      lineHeight: 1.7,
      letterSpacing: "0.01em",
    },

    body2: {
      fontSize: "clamp(0.875rem, 1.3vw, 0.95rem)",
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: "0.01em",
    },

    button: {
      fontSize: "clamp(0.875rem, 1.2vw, 1rem)",
      fontWeight: 600,
      lineHeight: 1.75,
      letterSpacing: "0.02em",
      textTransform: "none", // Modern buttons don't use all caps
    },

    caption: {
      fontSize: "clamp(0.75rem, 1vw, 0.875rem)",
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: "0.03em",
    },

    overline: {
      fontSize: "clamp(0.75rem, 1vw, 0.875rem)",
      fontWeight: 600,
      lineHeight: 2.66,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "12px 32px",
          fontSize: "1rem",
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0px 8px 16px rgba(0,0,0,0.15)",
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0px 8px 24px rgba(219,68,68,0.3)",
          },
        },
        outlined: {
          borderWidth: "2px",
          "&:hover": {
            borderWidth: "2px",
          },
        },
        sizeLarge: {
          padding: "16px 40px",
          fontSize: "1.1rem",
        },
        sizeSmall: {
          padding: "8px 24px",
          fontSize: "0.875rem",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 4px 16px rgba(0,0,0,0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
            transform: "translateY(-4px)",
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            transition: "all 0.3s ease",
            "&:hover": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#DB4444",
                borderWidth: "2px",
              },
            },
            "&.Mui-focused": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#DB4444",
                borderWidth: "2px",
              },
            },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
        },
        elevation2: {
          boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
        },
        elevation3: {
          boxShadow: "0px 8px 16px rgba(0,0,0,0.1)",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.1)",
            backgroundColor: "rgba(219, 68, 68, 0.08)",
          },
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
          transition: "color 0.3s ease",
          "&:hover": {
            color: "#DB4444",
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#191919",
          fontSize: "0.875rem",
          borderRadius: 8,
          padding: "8px 12px",
        },
        arrow: {
          color: "#191919",
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },

  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

export default theme;