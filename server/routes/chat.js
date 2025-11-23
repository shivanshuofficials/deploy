import express from 'express';
import { body, validationResult } from 'express-validator';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const conversations = await ChatMessage.getUserConversations(req.user._id);

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/chat/messages/:userId
 * @desc    Get messages between current user and another user
 * @access  Private
 */
router.get('/messages/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        // Verify other user exists
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const messages = await ChatMessage.getConversation(
            req.user._id,
            userId,
            parseInt(limit)
        );

        // Mark messages as read
        await ChatMessage.updateMany(
            {
                sender: userId,
                receiver: req.user._id,
                isRead: false
            },
            { isRead: true }
        );

        res.json({
            success: true,
            messages: messages.reverse(), // Oldest first
            otherUser: {
                id: otherUser._id,
                username: otherUser.username,
                email: otherUser.email
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/chat/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/messages', authenticate, [
    body('receiverId')
        .notEmpty()
        .withMessage('Receiver ID is required'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message cannot be empty')
        .isLength({ max: 1000 })
        .withMessage('Message cannot exceed 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { receiverId, message } = req.body;

        // Verify receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        // Create message
        const chatMessage = new ChatMessage({
            sender: req.user._id,
            receiver: receiverId,
            senderName: req.user.username,
            receiverName: receiver.username,
            message
        });

        await chatMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            chatMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/chat/messages/:id/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.put('/messages/:id/read', authenticate, async (req, res) => {
    try {
        const message = await ChatMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Only receiver can mark as read
        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        message.isRead = true;
        await message.save();

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking message as read',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/chat/unread-count
 * @desc    Get unread message count for current user
 * @access  Private
 */
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const count = await ChatMessage.countDocuments({
            receiver: req.user._id,
            isRead: false
        });

        res.json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count',
            error: error.message
        });
    }
});

export default router;
