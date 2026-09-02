const express = require('express');
const culture = require('../controllers/cultureController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/festivals', culture.listFestivals);
router.get('/festivals/:slug', optionalAuth, culture.getFestival);
router.get('/bundles', culture.listBundles);
router.get('/bundles/:slug', culture.getBundle);
router.post('/bundles/:id/add-to-cart', optionalAuth, culture.addBundleToCart);
router.get('/culture-guides', culture.listGuides);
router.get('/culture-guides/:slug', optionalAuth, culture.getGuide);
router.get('/artisans', culture.listArtisans);
router.get('/workshops', culture.listWorkshops);
router.post('/workshops/:id/inquire', optionalAuth, culture.inquireWorkshop);
router.post('/corporate/inquiry', optionalAuth, culture.corporateInquiry);
module.exports = router;
