const express = require('express');
const router = express.Router();
const { getChats, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/:orderId').get(protect, getChats);

module.exports = router;
