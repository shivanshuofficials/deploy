import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration and routes
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import chatRoutes from './routes/chat.js';

// Import models for Socket.IO
import ChatMessage from './models/ChatMessage.js';
import User from './models/User.js';
import { verifyToken } from './utils/jwt.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.username = user.username;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.username} (${socket.userId})`);

    // Join user's personal room for direct messages
    socket.join(socket.userId);

    // Handle joining a conversation room
    socket.on('join-conversation', (otherUserId) => {
        const roomId = [socket.userId, otherUserId].sort().join('-');
        socket.join(roomId);
        console.log(`User ${socket.username} joined conversation: ${roomId}`);
    });

    // Handle sending a message
    socket.on('send-message', async (data) => {
        try {
            const { receiverId, message } = data;

            // Verify receiver exists
            const receiver = await User.findById(receiverId);
            if (!receiver) {
                socket.emit('error', { message: 'Receiver not found' });
                return;
            }

            // Save message to database
            const chatMessage = new ChatMessage({
                sender: socket.userId,
                receiver: receiverId,
                senderName: socket.username,
                receiverName: receiver.username,
                message
            });

            await chatMessage.save();

            // Emit to both users
            const roomId = [socket.userId, receiverId].sort().join('-');
            io.to(roomId).emit('new-message', {
                id: chatMessage._id,
                sender: socket.userId,
                receiver: receiverId,
                senderName: socket.username,
                message,
                timestamp: chatMessage.timestamp,
                isRead: false
            });

            // Also emit to receiver's personal room for notifications
            io.to(receiverId).emit('message-notification', {
                from: socket.userId,
                fromName: socket.username,
                message,
                timestamp: chatMessage.timestamp
            });

            console.log(`Message sent from ${socket.username} to ${receiver.username}`);
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle typing indicator
    socket.on('typing', (receiverId) => {
        io.to(receiverId).emit('user-typing', {
            userId: socket.userId,
            username: socket.username
        });
    });

    socket.on('stop-typing', (receiverId) => {
        io.to(receiverId).emit('user-stop-typing', {
            userId: socket.userId
        });
    });

    // Handle marking messages as read
    socket.on('mark-read', async (data) => {
        try {
            const { senderId } = data;

            await ChatMessage.updateMany(
                {
                    sender: senderId,
                    receiver: socket.userId,
                    isRead: false
                },
                { isRead: true }
            );

            // Notify sender that messages were read
            io.to(senderId).emit('messages-read', {
                readBy: socket.userId
            });
        } catch (error) {
            console.error('Mark read error:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.username}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API: http://localhost:${PORT}/api`);
            console.log(`💬 Socket.IO ready for connections`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    httpServer.close(() => process.exit(1));
});

// Start the server
startServer();

// Export for Vercel
export default app;
