const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/Emails");
const { generateOTP } = require("../utils/GenerateOtp");
const Otp = require("../models/OTP");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { generateToken } = require("../utils/GenerateToken");
const PasswordResetToken = require("../models/PasswordResetToken");

/* ============================================================
   HELPER → Determine correct frontend URL
   ============================================================ */
const getFrontendUrl = (req) => {
    const requestOrigin =
        req.headers.origin ||
        req.headers.referer?.split("/").slice(0, 3).join("/");

    if (requestOrigin) return requestOrigin;

    const origins = process.env.ORIGIN.split(",").map((o) => o.trim());
    return origins[0];
};

/* ============================================================
   SIGNUP
   ============================================================ */
exports.signup = async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;

        const createdUser = new User(req.body);
        await createdUser.save();

        const secureInfo = sanitizeUser(createdUser);
        const token = generateToken(secureInfo);

        res.cookie("token", token, {
            sameSite: process.env.PRODUCTION === "true" ? "None" : "Lax",
            secure: process.env.PRODUCTION === "true",
            httpOnly: true,
            maxAge:
                parseInt(process.env.COOKIE_EXPIRATION_DAYS) *
                24 *
                60 *
                60 *
                1000,
        });

        return res.status(201).json(sanitizeUser(createdUser));
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error occurred during signup, please try again later",
        });
    }
};

/* ============================================================
   LOGIN
   ============================================================ */
exports.login = async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });

        if (
            existingUser &&
            (await bcrypt.compare(req.body.password, existingUser.password))
        ) {
            const secureInfo = sanitizeUser(existingUser);
            const token = generateToken(secureInfo);

            res.cookie("token", token, {
                sameSite: process.env.PRODUCTION === "true" ? "None" : "Lax",
                secure: process.env.PRODUCTION === "true",
                httpOnly: true,
                maxAge:
                    parseInt(process.env.COOKIE_EXPIRATION_DAYS) *
                    24 *
                    60 *
                    60 *
                    1000,
            });

            return res.status(200).json(sanitizeUser(existingUser));
        }

        res.clearCookie("token");
        return res.status(404).json({ message: "Invalid credentials" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Some error occurred while logging in, please try again later",
        });
    }
};

/* ============================================================
   VERIFY OTP
   ============================================================ */
exports.verifyOtp = async (req, res) => {
    try {
        const isValidUserId = await User.findById(req.body.userId);
        if (!isValidUserId) {
            return res
                .status(404)
                .json({ message: "User not found, for which the OTP has been generated" });
        }

        const isOtpExisting = await Otp.findOne({ user: isValidUserId._id });
        if (!isOtpExisting) {
            return res.status(404).json({ message: "OTP not found" });
        }

        if (isOtpExisting.expiresAt < new Date()) {
            await Otp.findByIdAndDelete(isOtpExisting._id);
            return res.status(400).json({ message: "OTP has expired" });
        }

        if (await bcrypt.compare(req.body.otp, isOtpExisting.otp)) {
            await Otp.findByIdAndDelete(isOtpExisting._id);
            const verifiedUser = await User.findByIdAndUpdate(
                isValidUserId._id,
                { isVerified: true },
                { new: true }
            );
            return res.status(200).json(sanitizeUser(verifiedUser));
        }

        return res.status(400).json({ message: "OTP is invalid or expired" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Some error occurred" });
    }
};

/* ============================================================
   RESEND OTP
   ============================================================ */
exports.resendOtp = async (req, res) => {
    try {
        const existingUser = await User.findById(req.body.user);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        await Otp.deleteMany({ user: existingUser._id });

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        const newOtp = new Otp({
            user: req.body.user,
            otp: hashedOtp,
            expiresAt:
                Date.now() +
                parseInt(process.env.OTP_EXPIRATION_TIME) * 1000,
        });

        await newOtp.save();

        await sendMail(
            existingUser.email,
            `Zara Boutiques — Email Verification`,
            `
            <h3>Your OTP is: ${otp}</h3>
            <p>This OTP expires in 2 minutes.</p>
            `
        );

        return res.status(201).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Some error occurred while resending OTP, please try again later",
        });
    }
};

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */
exports.forgotPassword = async (req, res) => {
    let newToken;
    try {
        const isExistingUser = await User.findOne({ email: req.body.email });

        if (!isExistingUser) {
            return res.status(404).json({ message: "Provided email does not exist" });
        }

        await PasswordResetToken.deleteMany({ user: isExistingUser._id });

        const passwordResetToken = generateToken(sanitizeUser(isExistingUser), true);
        const hashedToken = await bcrypt.hash(passwordResetToken, 10);

        newToken = new PasswordResetToken({
            user: isExistingUser._id,
            token: hashedToken,
            expiresAt:
                Date.now() +
                parseInt(process.env.OTP_EXPIRATION_TIME) * 1000,
        });

        await newToken.save();

        const frontendUrl = getFrontendUrl(req);
        const resetLink = `${frontendUrl}/reset-password/${isExistingUser._id}/${passwordResetToken}`;

        await sendMail(
            isExistingUser.email,
            "Zara Boutiques — Password Reset Request",
            `<p>Click to reset password:</p><a href="${resetLink}">${resetLink}</a>`
        );

        return res.status(200).json({
            message: `Password reset link sent to ${isExistingUser.email}`,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error occurred while sending password reset email",
        });
    }
};

/* ============================================================
   RESET PASSWORD
   ============================================================ */
exports.resetPassword = async (req, res) => {
    try {
        const isExistingUser = await User.findById(req.body.userId);
        if (!isExistingUser) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const isResetTokenExisting = await PasswordResetToken.findOne({
            user: isExistingUser._id,
        });

        if (!isResetTokenExisting) {
            return res.status(404).json({ message: "Reset link is not valid" });
        }

        if (isResetTokenExisting.expiresAt < new Date()) {
            await PasswordResetToken.findByIdAndDelete(isResetTokenExisting._id);
            return res.status(404).json({ message: "Reset link has expired" });
        }

        const incomingToken = decodeURIComponent(req.body.token);

        if (await bcrypt.compare(incomingToken, isResetTokenExisting.token)) {
            await PasswordResetToken.findByIdAndDelete(isResetTokenExisting._id);

            await User.findByIdAndUpdate(isExistingUser._id, {
                password: await bcrypt.hash(req.body.password, 10),
            });

            return res
                .status(200)
                .json({ message: "Password updated successfully" });
        }

        return res.status(404).json({ message: "Reset link has expired" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:
                "Error occurred while resetting the password, please try again later",
        });
    }
};

/* ============================================================
   LOGOUT
   ============================================================ */
exports.logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            sameSite: process.env.PRODUCTION === "true" ? "None" : "Lax",
            secure: process.env.PRODUCTION === "true",
            httpOnly: true,
        });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.log(error);
    }
};

/* ============================================================
   CHECK AUTH
   ============================================================ */
exports.checkAuth = async (req, res) => {
    try {
        if (!req.user) return res.sendStatus(401);

        const user = await User.findById(req.user._id);
        return res.status(200).json(sanitizeUser(user));
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};
