const express = require('express');
const { listCategories, listProducts, getProduct, getCategory } = require('../controllers/catalogController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/categories', listCategories);
router.get('/categories/:slug', optionalAuth, getCategory);
router.get('/products', optionalAuth, listProducts);
router.get('/products/:id', optionalAuth, getProduct);
module.exports = router;
