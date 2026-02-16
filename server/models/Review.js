const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        feedback: {
            type: String,
            required: [true, 'Please add feedback or complaint details'],
        },
        type: {
            type: String,
            enum: ['Review', 'Complaint'],
            default: 'Review',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Review', reviewSchema);
