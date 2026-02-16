const express = require('express');
const router = express.Router();
const { createReview, getAllReviews, getDriverReviews } = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/', protect, admin, getAllReviews);
router.get('/driver/:id', protect, getDriverReviews);

module.exports = router;
