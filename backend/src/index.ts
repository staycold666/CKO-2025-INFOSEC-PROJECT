import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createGameEvents } from './services/gameService';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual-laser-tag';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('Running without database connection. Some features will not work.');
    return false;
  }
};

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roomRoutes from './routes/roomRoutes';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);

// Socket.io setup
createGameEvents(io);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  const dbConnected = await connectDB();
  console.log(`Server running on port ${PORT}${dbConnected ? ' with database connection' : ' without database connection'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err.message);
  // Log the error but don't exit the process in development
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});