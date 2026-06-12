import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/premium_notes';
        
        await mongoose.connect(mongoURI);
        console.log('🍃 MongoDB Connected smoothly via Mongoose');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};