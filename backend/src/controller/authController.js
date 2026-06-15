import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.js';

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

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // Generate token
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email },
            process.env.JWT_SECRET || 'fallback_secret_for_development',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, birthdate: savedUser.birthdate, avatarUrl: savedUser.avatarUrl }
        });
    } catch (error) {
        res.status(500).json({ message: "Signup failed", error: error.message });
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
        if (avatarUrl) user.avatarUrl = avatarUrl;

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
