import crypto from "crypto";
import UserModel from "../models/user.model.js";
import { getToken } from "../utils/token.js";
import { sendPasswordResetEmail } from "../services/email.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Full Name is required" });
        }
        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedName = name.trim();

        // Check for existing user
        const existingUser = await UserModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        // Create new user (password is automatically hashed by pre-save hook)
        const user = await UserModel.create({
            name: normalizedName,
            email: normalizedEmail,
            password
        });

        const token = await getToken(user._id);
        res.cookie("token", token, cookieOptions);

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            credits: user.credits,
            isCreditAvailable: user.isCreditAvailable,
            notes: user.notes,
            createdAt: user.createdAt
        };

        return res.status(201).json({
            message: "Account created successfully",
            user: safeUser,
            token
        });
    } catch (error) {
        // Handle MongoDB duplicate key error in case of race condition
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }
        console.error("Register Error:", error);
        return res.status(500).json({ message: "Failed to register. Please try again later." });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Look up user and explicitly select password field
        const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

        // Do not reveal whether user exists or password was wrong
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = await getToken(user._id);
        res.cookie("token", token, cookieOptions);

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            credits: user.credits,
            isCreditAvailable: user.isCreditAvailable,
            notes: user.notes,
            createdAt: user.createdAt
        };

        return res.status(200).json({
            message: "Login successful",
            user: safeUser,
            token
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Login failed. Please try again later." });
    }
};

export const logOut = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ message: "Logout failed" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await UserModel.findOne({ email: normalizedEmail });

        if (user) {
            const rawToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
            await user.save();

            const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
            const resetUrl = `${clientBase}/reset-password/${rawToken}`;

            const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

            // In development, if SMTP is not configured, inform the developer in console without exposing to client
            if (!emailResult.sent && !isProduction) {
                console.log(`[DEV ONLY] Password reset link for ${user.email}: ${resetUrl}`);
            }
        }

        // Generic response to prevent user enumeration
        return res.status(200).json({
            message: "If an account with that email exists, password reset instructions have been sent."
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ message: "Error processing request. Please try again later." });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Reset token is required" });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await UserModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select("+password +resetPasswordToken +resetPasswordExpires");

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired" });
        }

        user.password = password; // Hashed by userSchema pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({
            message: "Password reset successful! You can now log in with your new password."
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({ message: "Failed to reset password. Please try again later." });
    }
};