// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/Auth");
const productRoutes = require("./routes/Product");
const orderRoutes = require("./routes/Order");
const cartRoutes = require("./routes/Cart");
const brandRoutes = require("./routes/Brand");
const categoryRoutes = require("./routes/Category");
const userRoutes = require("./routes/User");
const addressRoutes = require("./routes/Address");
const reviewRoutes = require("./routes/Review");
const wishlistRoutes = require("./routes/Wishlist");
const otpRoutes = require("./routes/Otp");
const googleAuthRoutes = require("./routes/googleAuth");

const { connectToDB } = require("./database/db");

// server init
const server = express();

// database connection
connectToDB()

// ---------- CORS CONFIG ----------
const isProduction = process.env.PRODUCTION === "true";

const allowedOrigins = process.env.ORIGIN
    ? process.env.ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:3000"];

const corsOptions = {
    origin(origin, callback) {
        // No origin → allow (Postman, curl, mobile apps, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // DEV MODE: allow everything (use this on your laptop)
        if (!isProduction) {
            return callback(null, true);
        }

        // PROD MODE: strict allow-list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true, // allow cookies
    exposedHeaders: ["X-Total-Count"],
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
};

// ---------- MIDDLEWARES ----------
server.use(cors(corsOptions));
server.use(express.json({ limit: "10mb" }));
server.use(express.urlencoded({ extended: true, limit: "10mb" }));
server.use(cookieParser());
server.use(morgan("tiny"));

// ---------- ROUTES ----------
server.use("/auth", authRoutes);
server.use("/users", userRoutes);
server.use("/products", productRoutes);
server.use("/orders", orderRoutes);
server.use("/cart", cartRoutes);
server.use("/brands", brandRoutes);
server.use("/categories", categoryRoutes);
server.use("/address", addressRoutes);
server.use("/reviews", reviewRoutes);
server.use("/wishlist", wishlistRoutes);
server.use("/otp", otpRoutes);
server.use(googleAuthRoutes)

server.get("/", (req, res) => {
    res.status(200).json({ message: "Server running" });
});

const PORT = process.env.PORT || 8000;

// Bind to 0.0.0.0 so LAN devices can hit it
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server [STARTED] ~ http://localhost:${PORT}`);
    console.log(
        `Network access available at PORT:${PORT}`
    );
});
