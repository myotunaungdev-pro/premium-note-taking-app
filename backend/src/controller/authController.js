import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import User from '../model/user.js';
import { generateOTP } from '../utils/generateOTP.js';
import { sendEmail } from '../utils/sendEmail.js';

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpSalt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, otpSalt);

        // Create new user (isVerified defaults to false)
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            otp: hashedOtp,
            otpExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        const savedUser = await newUser.save();

        // Send OTP email
        const message = `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
                <h2 style="color: #00d4aa;">Verify Your Email Address</h2>
                <p>Hello ${name},</p>
                <p>Thank you for signing up for Premium Note-Taking App. Please use the following 6-digit code to verify your email address and activate your account:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="margin: 0; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>The Premium Note-Taking App Team</p>
            </div>
        `;

        await sendEmail({
            email: savedUser.email,
            subject: 'Premium Note-Taking App - Email Verification OTP',
            message
        });

        res.status(201).json({
            message: "User created successfully. Please check your email for the verification code.",
            email: savedUser.email
        });
    } catch (error) {
        res.status(500).json({ message: "Signup failed", error: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }

        // Check expiration
        if (!user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Compare OTP
        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Valid OTP, verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret_for_development',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Email verified successfully",
            token,
            user: { id: user._id, name: user.name, email: user.email, birthdate: user.birthdate, avatarUrl: user.avatarUrl }
        });

    } catch (error) {
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email address to login." });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret_for_development',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email, birthdate: user.birthdate, avatarUrl: user.avatarUrl }
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email, birthdate, avatarUrl } = req.body;
        
        // Ensure user is authenticated (via authMiddleware)
        const userId = req.user.id;

        // Find user by id
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email is already taken" });
            }
            user.email = email;
        }

        // Update fields
        if (name) user.name = name;
        if (birthdate) user.birthdate = birthdate;
        
        if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
            // If the user already had an avatar, delete it from Cloudinary to prevent storage bloat
            if (user.avatarUrl) {
                try {
                    cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                        api_key: process.env.CLOUDINARY_API_KEY,
                        api_secret: process.env.CLOUDINARY_API_SECRET
                    });

                    const parts = user.avatarUrl.split('/upload/');
                    if (parts.length > 1) {
                        const pathWithVersion = parts[1];
                        const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, '');
                        const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
                        const publicId = lastDotIndex !== -1 ? pathWithoutVersion.substring(0, lastDotIndex) : pathWithoutVersion;
                        
                        if (publicId && process.env.CLOUDINARY_API_KEY) {
                            await cloudinary.uploader.destroy(publicId);
                        }
                    }
                } catch (err) {
                    console.error("Cloudinary cleanup failed:", err);
                }
            }
            user.avatarUrl = avatarUrl;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: { 
                id: updatedUser._id, 
                name: updatedUser.name, 
                email: updatedUser.email,
                birthdate: updatedUser.birthdate,
                avatarUrl: updatedUser.avatarUrl
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Return 404 to be helpful, though 200 is safer for avoiding email enumeration
            return res.status(404).json({ message: "No account found with that email address." });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpSalt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, otpSalt);

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP email
        const message = `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
                <h2 style="color: #00d4aa;">Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset for your Premium Note-Taking App account. Please use the following 6-digit code to securely reset your password:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="margin: 0; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>Best regards,<br>The Premium Note-Taking App Team</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Premium Note-Taking App - Password Reset OTP',
            message
        });

        res.status(200).json({ message: "Password reset OTP sent to your email." });
    } catch (error) {
        res.status(500).json({ message: "Failed to process forgot password request", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check expiration
        if (!user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Compare OTP
        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        // Valid OTP, hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
};
