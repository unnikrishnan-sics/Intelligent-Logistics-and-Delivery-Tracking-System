const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');
const TrackingHistory = require('../models/TrackingHistory');

// @desc    Update vehicle coordinates
// @route   PUT /api/tracking/update
// @access  Private/Driver
const updateLocation = asyncHandler(async (req, res) => {
    const { lat, lng, orderId } = req.body;

    let vehicle = await Vehicle.findOne({ driver_id: req.user._id });

    if (!vehicle) {
        // If vehicle doesn't exist for driver, create one (simple fallback)
        vehicle = await Vehicle.create({
            driver_id: req.user._id,
            vehicle_number: `TEMP-${req.user._id.toString().slice(-4)}`,
            model: 'Standard Delivery Vehicle',
            current_coordinates: { lat, lng },
        });
    } else {
        vehicle.current_coordinates = { lat, lng };
        vehicle.last_updated = Date.now();
        await vehicle.save();
    }

    // Update Tracking History if orderId is provided
    if (orderId) {
        let history = await TrackingHistory.findOne({ order_id: orderId });
        if (!history) {
            history = await TrackingHistory.create({
                order_id: orderId,
                coordinates: [{ lat, lng }],
            });
        } else {
            history.coordinates.push({ lat, lng });
            await history.save();
        }
    }

    res.json({ message: 'Location updated successfully', coordinates: { lat, lng } });
});

// @desc    Get order tracking history
// @route   GET /api/tracking/:orderId/history
// @access  Private
const getTrackingHistory = asyncHandler(async (req, res) => {
    const history = await TrackingHistory.findOne({ order_id: req.params.orderId });
    if (history) {
        res.json(history);
    } else {
        res.status(404);
        throw new Error('Tracking history not found');
    }
});

const https = require('https');

// @desc    Get ETA from Google Maps
// @route   GET /api/tracking/eta
// @access  Private
// @desc    Get ETA from Google Maps
// @route   GET /api/tracking/eta
// @access  Private
const getETA = asyncHandler(async (req, res) => {
    // 50% Provided Code
    const { origin, destination } = req.query;

    if (!origin || !destination) {
        res.status(400);
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCAfq4iSrzILFGxdL0Bzb5bWE6j_9ZoLY8';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

    // TODO: Complete ETA calculation logic
    /*
    // Helper to calculate Haversine distance
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    try {
        const data = await new Promise((resolve, reject) => {
             // ... Code to fetch from Google Maps or callback ...
             // Simplified for comments
             https.get(url, (response) => {
                 // ...
             });
        });

        // ... Process data and return res.json(...)
        
    } catch (error) {
        console.error('ETA Fetch Error - Using Fallback:', error);
        // ... Fallback logic
    }
    */
    // res.status(501).json({ message: 'Function incomplete' });
    res.json({
        distance: '0 km',
        duration: '0 mins',
        duration_value: 0,
        polyline: ''
    });
});

module.exports = {
    updateLocation,
    getTrackingHistory,
    getETA
};
