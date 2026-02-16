const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
const getDrivers = asyncHandler(async (req, res) => {
    const drivers = await User.find({ role: 'Driver' }).select('-password');
    res.json(drivers);
});

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await User.find({ role: 'Customer' }).select('-password');
    res.json(customers);
});

// @desc    Get Logistics Analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const outForDeliveryOrders = await Order.countDocuments({ status: 'Out for Delivery' });
    const totalDrivers = await User.countDocuments({ role: 'Driver' });

    res.json({
        totalOrders,
        deliveredOrders,
        pendingOrders,
        outForDeliveryOrders,
        totalDrivers,
    });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    // 50% Provided Code
    const user = await User.findById(req.params.id);

    if (user) {
        // TODO: Complete the deletion logic
        /*
        if (user.role === 'Admin' && (await User.countDocuments({ role: 'Admin' })) <= 1) {
            res.status(400);
            throw new Error('Cannot delete the last admin');
        }
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
        */
        res.status(501).json({ message: 'Function incomplete' });

    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Approve user (Driver)
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
const approveUser = asyncHandler(async (req, res) => {
    // 50% Provided Code
    const user = await User.findById(req.params.id);

    if (user) {
        // TODO: Complete approval logic
        /*
        user.isApproved = true;
        await user.save();
        res.json({ message: 'User approved' });
        */
        res.status(501).json({ message: 'Function incomplete' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getDrivers,
    getCustomers,
    getAnalytics,
    deleteUser,
    approveUser
};
