const express = require('express');
const { getWallet, getTransactions, topUp, transfer } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.post('/topup', topUp);
router.post('/transfer', transfer);
module.exports = router;
