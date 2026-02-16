const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrderById,
    assignDriver,
    updateOrderStatus,
    verifyOrderOTP,
} = require('../controllers/orderController');
const { protect, admin, driver } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.put('/:id/assign', protect, admin, assignDriver);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/verify', protect, driver, verifyOrderOTP);

module.exports = router;
