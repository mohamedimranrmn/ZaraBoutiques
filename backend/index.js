require("dotenv").config()
const express = require('express')
const cors = require('cors')
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/Auth")
const productRoutes = require("./routes/Product")
const orderRoutes = require("./routes/Order")
const cartRoutes = require("./routes/Cart")
const brandRoutes = require("./routes/Brand")
const categoryRoutes = require("./routes/Category")
const userRoutes = require("./routes/User")
const addressRoutes = require('./routes/Address')
const reviewRoutes = require("./routes/Review")
const wishlistRoutes = require("./routes/Wishlist")
const { connectToDB } = require("./database/db")
const otpRoutes = require("./routes/Otp");

// server init
const server = express()

// database connection
connectToDB()

// CORS Configuration
const allowedOrigins = process.env.ORIGIN
    ? process.env.ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or curl)
        if (!origin) return callback(null, true);

        // In development mode, allow all origins
        if (process.env.PRODUCTION === "false") {
            return callback(null, true);
        }

        // In production, check against allowed origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['X-Total-Count'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS']
};

// middlewares
server.use(cors(corsOptions))
server.use(express.json({ limit: '10mb' })) // Increased limit for base64 images
server.use(express.urlencoded({ extended: true, limit: '10mb' }))
server.use(cookieParser())
server.use(morgan("tiny"))

// routeMiddleware
server.use("/auth", authRoutes)
server.use("/users", userRoutes)
server.use("/products", productRoutes)
server.use("/orders", orderRoutes)
server.use("/cart", cartRoutes)
server.use("/brands", brandRoutes)
server.use("/categories", categoryRoutes)
server.use("/address", addressRoutes)
server.use("/reviews", reviewRoutes)
server.use("/wishlist", wishlistRoutes)
server.use("/otp", require("./routes/Otp"));

server.get("/", (req, res) => {
    res.status(200).json({ message: 'Server running' })
})

const PORT = process.env.PORT || 8000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`server [STARTED] ~ http://localhost:${PORT}`);
    console.log(`Network access available at http://192.168.1.37:${PORT}`);
})
