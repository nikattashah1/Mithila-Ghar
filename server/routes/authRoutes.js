const express = require('express');
const { register, login, requestPasswordReset, resetPassword, me, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/logout', (req, res) => res.json({ message: 'Logged out.' }));
router.get('/me', protect, me);
router.put('/me', protect, updateMe);
module.exports = router;

