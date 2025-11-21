const router = require("express").Router();
const passport = require("../utils/googleAuth");
const jwt = require("jsonwebtoken");

router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
        const user = req.user;

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "None",
            secure: false,
        });

        res.redirect("http://localhost:3000");
    }
);

module.exports = router;
