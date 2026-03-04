const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isApproved) {
            res.status(403);
            throw new Error('Account pending approval. Please wait for admin verification.');
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Force role to be Customer by default if not specified, or restrict to non-admin
    const roleToAssign = (role && role !== 'Admin') ? role : 'Customer';
    const isApproved = roleToAssign === 'Driver' ? false : true;

    const user = await User.create({
        name,
        email,
        password,
        role: roleToAssign,
        phone,
        isApproved
    });

    if (user) {
        // Send Welcome Email
        try {
            const sendEmail = require('../utils/sendEmail');
            await sendEmail({
                email: user.email,
                subject: 'Welcome to IntelliDrive',
                message: `Hi ${user.name},\n\nWelcome to IntelliDrive! We're excited to have you on board.\n\nBest Regards,\nIntelliDrive Team`,
                html: `<h1>Welcome to IntelliDrive!</h1><p>Hi ${user.name},</p><p>We're excited to have you on board.</p><p>Best Regards,</p><p>IntelliDrive Team</p>`
            });
        } catch (error) {
            console.error('Email send failed:', error);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            isApproved: updatedUser.isApproved,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
};
