const express = require('express');
const router = express.Router();
const { verifyPayment, checkPaymentStatus } = require('../controllers/paymentVerificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.use(authMiddleware);

// Verify UPI payment
router.post('/verify', verifyPayment);

// Check payment status by transaction ID
router.get('/status/:transactionId', checkPaymentStatus);

module.exports = router;
