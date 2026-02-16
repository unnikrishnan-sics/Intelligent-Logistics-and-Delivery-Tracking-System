const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order = require('../models/Order');

// @desc    Create a new review or complaint
// @route   POST /api/reviews
// @access  Private (Customer)
const createReview = asyncHandler(async (req, res) => {
    const { orderId, rating, feedback, type } = req.body;

    const order = await Order.findById(orderId).populate('driver_id');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.sender.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to review this order');
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
        res.status(400);
        throw new Error('Review already submitted for this order');
    }

    const review = await Review.create({
        order: orderId,
        driver: order.driver_id ? order.driver_id._id : null, // Handle unassigned logic if needed, but usually review is for driver
        customer: req.user._id,
        rating,
        feedback,
        type: type || 'Review'
    });

    res.status(201).json(review);
});

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private (Admin)
const getAllReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find()
        .populate('order', 'receiver_name dest_addr')
        .populate('driver', 'name email')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 });
    res.json(reviews);
});

// @desc    Get reviews for a driver
// @route   GET /api/reviews/driver/:id
// @access  Private (Admin/Driver)
const getDriverReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ driver: req.params.id })
        .populate('customer', 'name')
        .sort({ createdAt: -1 });
    res.json(reviews);
});

module.exports = {
    createReview,
    getAllReviews,
    getDriverReviews
};
