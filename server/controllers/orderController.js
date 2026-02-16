const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const crypto = require('crypto');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Admin or Customer)
const createOrder = asyncHandler(async (req, res) => {
    const {
        receiver_name,
        receiver_phone,
        pickup_addr,
        dest_addr,
        weight,
        priority,
        pickup_coordinates,
        dest_coordinates,
    } = req.body;

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Determine sender: If admin specifies sender_id, use it; otherwise use the logged-in user
    let senderId = req.user._id;
    if (req.user.role === 'Admin' && req.body.sender_id) {
        senderId = req.body.sender_id;
    }

    try {
        const order = await Order.create({
            sender: senderId,
            receiver_name,
            receiver_phone,
            pickup_addr,
            dest_addr,
            weight,
            priority,
            otp,
            pickup_coordinates,
            dest_coordinates,
        });

        if (order) {
            // Send Order Confirmation Email
            try {
                const sendEmail = require('../utils/sendEmail');
                const user = req.user; // User is already attached by protect middleware
                await sendEmail({
                    email: user.email,
                    subject: 'Order Placed Successfully - IntelliDrive',
                    message: `Hi ${user.name},\n\nYour order has been placed successfully. Order ID: ${order._id}\nOTP for delivery: ${otp}\n\nTrack your order on the dashboard.\n\nBest Regards,\nIntelliDrive Team`,
                    html: `<h1>Order Placed Successfully</h1><p>Hi ${user.name},</p><p>Your order has been placed successfully.</p><p><b>Order ID:</b> ${order._id}</p><p><b>OTP for delivery:</b> ${otp}</p><p>Track your order on the dashboard.</p><p>Best Regards,</p><p>IntelliDrive Team</p>`
                });
            } catch (error) {
                console.error('Order email send failed:', error);
            }

            res.status(201).json(order);
        } else {
            res.status(400);
            throw new Error('Invalid order data');
        }
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(400); // Bad Request for validation errors
        throw error;
    }
});

// @desc    Get all orders (Admin) or user's orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
    let orders;
    if (req.user.role === 'Admin') {
        orders = await Order.find({})
            .populate('sender', 'name email')
            .populate('driver_id', 'name phone email current_coordinates')
            .sort({ createdAt: -1 });
    } else if (req.user.role === 'Driver') {
        orders = await Order.find({ driver_id: req.user._id })
            .populate('sender', 'name email phone')
            .sort({ createdAt: -1 });
    } else {
        orders = await Order.find({ sender: req.user._id })
            .populate('driver_id', 'name phone current_coordinates')
            .sort({ createdAt: -1 });
    }
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('sender', 'name email phone')
        .populate('driver_id', 'name email phone');

    if (order) {
        // Basic access check
        if (
            req.user.role !== 'Admin' &&
            order.sender._id.toString() !== req.user._id.toString() &&
            (!order.driver_id || order.driver_id._id.toString() !== req.user._id.toString())
        ) {
            res.status(401);
            throw new Error('Not authorized to view this order');
        }
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Assign driver to order
// @route   PUT /api/orders/:id/assign
// @access  Private/Admin
const assignDriver = asyncHandler(async (req, res) => {
    // 50% Provided Code
    const { driver_id } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        order.driver_id = driver_id;
        order.status = 'Assigned';
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Driver or Admin)
// @access  Private (Driver or Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
    // 50% Provided Code
    const { status, pickup_proof } = req.body;
    const order = await Order.findById(req.params.id).populate('sender', 'name email');

    if (order) {
        order.status = status;
        if (pickup_proof) {
            order.pickup_proof = pickup_proof;
        }
        const updatedOrder = await order.save();

        // Send Status Update Email
        if (['Assigned', 'Out for Delivery'].includes(status)) {
            try {
                const sendEmail = require('../utils/sendEmail');
                await sendEmail({
                    email: order.sender?.email,
                    subject: `Order Update - ${status}`,
                    message: `Hi ${order.sender?.name || 'Customer'},\n\nYour order #${order._id.toString().slice(-6).toUpperCase()} is now ${status}.\n\nYou can track it in your dashboard.`,
                    html: `<h1>Order Update</h1><p>Hi ${order.sender?.name || 'Customer'},</p><p>Your order <b>#${order._id.toString().slice(-6).toUpperCase()}</b> is now <b>${status}</b>.</p><p>You can track it in your dashboard.</p>`
                });
            } catch (error) {
                console.error('Status update email failed:', error);
            }
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Verify OTP and mark as delivered
// @route   PUT /api/orders/:id/verify
// @access  Private/Driver
// @access  Private/Driver
const verifyOrderOTP = asyncHandler(async (req, res) => {
    // 50% Provided Code
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        if (order.otp === otp) {
            order.status = 'Delivered';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(400);
            throw new Error('Invalid OTP');
        }
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    assignDriver,
    updateOrderStatus,
    verifyOrderOTP,
};
