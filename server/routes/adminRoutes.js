const express = require('express');
const router = express.Router();
const {
    getDrivers,
    getCustomers,
    getAnalytics,
    deleteUser,
    approveUser
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/drivers', protect, admin, getDrivers);
router.get('/customers', protect, admin, getCustomers);
router.get('/analytics', protect, admin, getAnalytics);
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/users/:id/approve', protect, admin, approveUser);

module.exports = router;
