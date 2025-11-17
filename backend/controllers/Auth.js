const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/Emails");
const { generateOTP } = require("../utils/GenerateOtp");
const Otp = require("../models/OTP");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { generateToken } = require("../utils/GenerateToken");
const PasswordResetToken = require("../models/PasswordResetToken");

// Helper function to get the correct frontend URL
const getFrontendUrl = (req) => {
    // Use the origin from the request header (this will be the URL the user is currently using)
    const requestOrigin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');

    if (requestOrigin) {
        return requestOrigin;
    }

    // Fallback to the first origin in the environment variable
    const origins = process.env.ORIGIN.split(',').map(origin => origin.trim());
    return origins[0];
};

// USER SIGNUP
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
            maxAge:
                new Date(
                    Date.now() +
                    parseInt(process.env.COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
                ),
            httpOnly: true,
            secure: process.env.PRODUCTION === "true" ? true : false,
        });

        res.status(201).json(sanitizeUser(createdUser));
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: "Error occurred during signup, please try again later" });
    }
};

// USER LOGIN
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
                maxAge:
                    new Date(
                        Date.now() +
                        parseInt(
                            process.env.COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
                        )
                    ),
                httpOnly: true,
                secure: process.env.PRODUCTION === "true" ? true : false,
            });
            return res.status(200).json(sanitizeUser(existingUser));
        }

        res.clearCookie("token");
        return res.status(404).json({ message: "Invalid credentials" });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({
                message:
                    "Some error occurred while logging in, please try again later",
            });
    }
};

// VERIFY OTP
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

        if (isOtpExisting && (await bcrypt.compare(req.body.otp, isOtpExisting.otp))) {
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
        res.status(500).json({ message: "Some error occurred" });
    }
};

// RESEND OTP (Zara Boutiques Styled)
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
            expiresAt: Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME),
        });
        await newOtp.save();

        await sendMail(
            existingUser.email,
            `Zara Boutiques — Email Verification`,
            `
      <div style="font-family:'Poppins',sans-serif;color:#333;background:#f9f9f9;padding:20px;border-radius:10px;border:1px solid #ddd;max-width:480px;margin:auto;">
        <div style="text-align:center;margin-bottom:20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/pasikkodu.firebasestorage.app/o/postImages%2F1762979018927-user_2vxYWQOJjctj65Mmq7FpVw3h3im.jpg?alt=media&token=8dd42f9b-51a9-4d2e-a9d4-55e398fb8ebd" alt="Zara Boutiques" width="120" />
        </div>
        <h2 style="color:#DB4444;text-align:center;">Verify Your Email Address</h2>
        <p style="font-size:1rem;">Hello <b>${existingUser.name || 'User'}</b>,</p>
        <p>Your One-Time Password (OTP) for verifying your <b>Zara Boutiques</b> account is:</p>
        <h1 style="color:#000;text-align:center;letter-spacing:6px;margin:20px 0;">${otp}</h1>
        <p style="font-size:0.95rem;">This OTP will expire in <b>2 minutes</b>. Please do not share it with anyone.</p>
        <p style="margin-top:30px;font-size:0.9rem;color:#555;">Thank you for joining <b>Zara Boutiques</b> — we're excited to have you!</p>
      </div>
      `
        );

        res.status(201).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: "Some error occurred while resending OTP, please try again later" });
    }
};

// FORGOT PASSWORD (Zara Boutiques Styled) - FIXED
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
            expiresAt: Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME),
        });
        await newToken.save();

        // Get the correct frontend URL based on the request
        const frontendUrl = getFrontendUrl(req);
        const resetLink = `${frontendUrl}/reset-password/${isExistingUser._id}/${passwordResetToken}`;

        await sendMail(
            isExistingUser.email,
            "Zara Boutiques — Password Reset Request",
            `
      <div style="font-family:'Poppins',sans-serif;color:#333;background:#f9f9f9;padding:25px;border-radius:10px;border:1px solid #ddd;max-width:500px;margin:auto;">
        <div style="text-align:center;margin-bottom:20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/pasikkodu.firebasestorage.app/o/postImages%2F1762979018927-user_2vxYWQOJjctj65Mmq7FpVw3h3im.jpg?alt=media&token=8dd42f9b-51a9-4d2e-a9d4-55e398fb8ebd" alt="Zara Boutiques" width="120" />
        </div>
        <h2 style="color:#DB4444;text-align:center;">Password Reset Request</h2>
        <p style="font-size:1rem;">Hello <b>${isExistingUser.name || 'User'}</b>,</p>
        <p>We received a request to reset your password for your <b>Zara Boutiques</b> account.</p>
        <p>If you made this request, click the button below to set a new password:</p>
        <div style="text-align:center;margin:20px 0;">
          <a href="${resetLink}" 
             target="_blank" 
             style="display:inline-block;padding:12px 20px;background-color:#DB4444;color:white;text-decoration:none;border-radius:8px;font-weight:500;">
             Reset Password
          </a>
        </div>
        <p>This link will expire soon. If you did not request a password reset, please ignore this email.</p>
        <p style="margin-top:30px;color:#555;">— The Zara Boutiques Team</p>
      </div>
      `
        );

        res.status(200).json({ message: `Password reset link sent to ${isExistingUser.email}` });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: "Error occurred while sending password reset email" });
    }
};

// RESET PASSWORD
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

        if (
            isResetTokenExisting &&
            isResetTokenExisting.expiresAt > new Date() &&
            (await bcrypt.compare(req.body.token, isResetTokenExisting.token))
        ) {
            await PasswordResetToken.findByIdAndDelete(isResetTokenExisting._id);
            await User.findByIdAndUpdate(isExistingUser._id, {
                password: await bcrypt.hash(req.body.password, 10),
            });
            return res.status(200).json({ message: "Password updated successfully" });
        }

        return res.status(404).json({ message: "Reset link has expired" });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({
                message:
                    "Error occurred while resetting the password, please try again later",
            });
    }
};

// LOGOUT
exports.logout = async (req, res) => {
    try {
        res.cookie("token", {
            maxAge: 0,
            sameSite: process.env.PRODUCTION === "true" ? "None" : "Lax",
            httpOnly: true,
            secure: process.env.PRODUCTION === "true" ? true : false,
        });
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.log(error);
    }
};

// CHECK AUTH
exports.checkAuth = async (req, res) => {
    try {
        if (req.user) {
            const user = await User.findById(req.user._id);
            return res.status(200).json(sanitizeUser(user));
        }
        res.sendStatus(401);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
};