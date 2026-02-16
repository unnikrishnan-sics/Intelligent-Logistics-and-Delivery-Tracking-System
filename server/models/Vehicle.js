const mongoose = require('mongoose');

const vehicleSchema = mongoose.Schema(
    {
        driver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        vehicle_number: {
            type: String,
            required: true,
            unique: true,
        },
        model: {
            type: String,
            required: true,
        },
        current_coordinates: {
            lat: {
                type: Number,
                default: 0,
            },
            lng: {
                type: Number,
                default: 0,
            },
        },
        status: {
            type: String,
            enum: ['Active', 'Maintenance', 'Inactive'],
            default: 'Active',
        },
        last_updated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
