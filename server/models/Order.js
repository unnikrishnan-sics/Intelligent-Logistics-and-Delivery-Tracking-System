const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver_name: {
            type: String,
            required: true,
        },
        receiver_phone: {
            type: String,
            required: [true, 'Please add receiver phone'],
            match: [/^\d{10,15}$/, 'Please add a valid phone number']
        },
        pickup_addr: {
            type: String,
            required: [true, 'Please add pickup address'],
        },
        dest_addr: {
            type: String,
            required: [true, 'Please add destination address'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled', 'Delayed'],
            default: 'Pending',
        },
        weight: {
            type: Number,
            required: [true, 'Please add weight'],
            min: [0.1, 'Weight must be at least 0.1 kg']
        },
        priority: {
            type: String,
            enum: ['Standard', 'Urgent', 'High Priority'],
            default: 'Standard',
        },
        otp: {
            type: String,
            required: true,
        },
        pickup_proof: {
            type: String, // Base64 image string
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        driver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        pickup_coordinates: {
            lat: Number,
            lng: Number,
        },
        dest_coordinates: {
            lat: Number,
            lng: Number,
        },
        delivery_date: Date,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Order', orderSchema);
