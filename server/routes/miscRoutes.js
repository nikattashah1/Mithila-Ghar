const express = require('express');
const { listReviews, createReview } = require('../controllers/reviewController');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { subscribe, trackEvent, recommendations, contact, configPublic } = require('../controllers/miscController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/reviews', listReviews);
router.post('/reviews', protect, createReview);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:id', protect, removeFromWishlist);
router.post('/marketing/subscribe', optionalAuth, subscribe);
router.post('/analytics/events', optionalAuth, trackEvent);
router.get('/recommendations', optionalAuth, recommendations);
router.post('/contact', contact);
router.get('/config', configPublic);
module.exports = router;
