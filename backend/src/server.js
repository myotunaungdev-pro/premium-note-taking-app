import dns from 'node:dns/promises';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './route/route.js';
import authRoutes from './route/authRoutes.js';
import { connectDB } from './utils/database.js';

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', router);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// Database Connection and Server Initialization
const startServer = async () => {
    try {
        await connectDB();
        console.log('🍃 Database connected successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Backend API running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start the server:', error.message);
        process.exit(1);
    }
};

startServer();