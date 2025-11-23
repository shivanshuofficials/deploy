import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    receiverName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
chatMessageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
chatMessageSchema.index({ receiver: 1, isRead: 1 });

// Method to get conversation between two users
chatMessageSchema.statics.getConversation = async function (userId1, userId2, limit = 50) {
    return this.find({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 }
        ]
    })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// Method to get all conversations for a user
chatMessageSchema.statics.getUserConversations = async function (userId) {
    const conversations = await this.aggregate([
        {
            $match: {
                $or: [
                    { sender: new mongoose.Types.ObjectId(userId) },
                    { receiver: new mongoose.Types.ObjectId(userId) }
                ]
            }
        },
        {
            $sort: { timestamp: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
                        '$receiver',
                        '$sender'
                    ]
                },
                lastMessage: { $first: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                                    { $eq: ['$isRead', false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'otherUser'
            }
        },
        {
            $unwind: '$otherUser'
        },
        {
            $project: {
                userId: '$_id',
                username: '$otherUser.username',
                email: '$otherUser.email',
                lastMessage: 1,
                unreadCount: 1
            }
        },
        {
            $sort: { 'lastMessage.timestamp': -1 }
        }
    ]);

    return conversations;
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
