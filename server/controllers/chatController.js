const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');

// @desc    Get chats for an order
// @route   GET /api/chat/:orderId
// @access  Private
const getChats = asyncHandler(async (req, res) => {
    const chats = await Chat.find({ orderId: req.params.orderId })
        .populate('sender', 'name role')
        .sort({ createdAt: 1 });
    res.json(chats);
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

    let chat = await Chat.create({
        orderId,
        sender: req.user._id,
        message,
    });

    chat = await chat.populate('sender', 'name role');

    res.status(201).json(chat);
});

module.exports = { getChats, sendMessage };
