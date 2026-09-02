const express = require('express');
const {
  processCheckout,
  createEsewaPayment,
  handleEsewaSuccess,
  handleEsewaFailure,
  getMyOrders,
  getOrderById
} = require('../controllers/orderPaymentController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/checkout', protect, processCheckout);
router.post('/payments/card', protect, processCheckout);
router.route('/payments/esewa/init')
  .post(protect, createEsewaPayment)
  .get(protect, createEsewaPayment);
router.get('/payments/esewa/success', handleEsewaSuccess);
router.get('/payments/esewa/failure', handleEsewaFailure);
router.get('/orders', protect, getMyOrders);
router.get('/orders/:id', protect, getOrderById);

module.exports = router;
