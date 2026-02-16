const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');

// @desc    Get chats for an order
// @route   GET /api/chat/:orderId
// @access  Private
const getChats = asyncHandler(async (req, res) => {
    // Simulation: Return empty chat list or dummy message
    res.json([]);
});

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { orderId, message } = req.body;

    if (!message || !orderId) {
        res.status(400);
        throw new Error('Invalid message data');
    }

    // Simulation: Return success without saving
    res.status(201).json({
        orderId,
        sender: req.user._id,
        message,
        createdAt: new Date(),
        senderName: req.user.name
    });
});

module.exports = { getChats, sendMessage };
