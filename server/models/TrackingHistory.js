const mongoose = require('mongoose');

const trackingHistorySchema = mongoose.Schema(
    {
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        coordinates: [
            {
                lat: Number,
                lng: Number,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('TrackingHistory', trackingHistorySchema);
