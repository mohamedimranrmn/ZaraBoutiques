const express = require("express");
const router = express.Router();
const ImageKit = require("imagekit");

require("dotenv").config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
    urlEndpoint: "https://ik.imagekit.io/oimknz0uq"
});

router.get("/", (req, res) => {
    try {
        const auth = imagekit.getAuthenticationParameters();
        return res.status(200).json(auth);
    } catch (err) {
        return res.status(500).json({ message: "Auth generation failed" });
    }
});

module.exports = router;
