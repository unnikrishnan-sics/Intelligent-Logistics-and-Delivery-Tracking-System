const express = require('express');
const router = express.Router();
const {
    updateLocation,
    getTrackingHistory,
    getETA
} = require('../controllers/trackingController');
const { protect, driver } = require('../middleware/authMiddleware');

router.put('/update', protect, driver, updateLocation);
router.get('/eta', protect, getETA);
router.get('/:orderId/history', protect, getTrackingHistory);

module.exports = router;
