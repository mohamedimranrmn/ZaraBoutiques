// 1. Import 'path' and configure 'dotenv' FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { seedBrand } = require("./Brand");
const { seedCategory } = require("./Category");
const { seedProduct } = require("./Product");
const { seedUser } = require("./User");
const { seedAddress } = require("./Address");
const { seedWishlist } = require("./Wishlist");
const { seedCart } = require("./Cart");
const { seedReview } = require("./Review");
const { seedOrder } = require("./Order");
const { connectToDB } = require("../database/db");
const mongoose = require('mongoose');

const seedData = async () => {
    try {
        // 2. Connect to DB (Now process.env.MONGO_URI will be defined)
        await connectToDB();

        console.log('Seed [started] please wait..');

        // 3. Run seeds
        await seedBrand();
        await seedCategory();
        await seedProduct();

        // Uncomment these as you build those files
        // await seedUser();
        // await seedAddress();
        // await seedWishlist();
        // await seedCart();
        // await seedReview();
        // await seedOrder();

        console.log('Seed completed..');

        // 4. Optional: Close connection when done so the script exits
        await mongoose.connection.close();
        console.log('Connection closed.');

    } catch (error) {
        console.log('Seeding Error:', error);
    }
}

seedData();