const express = require('express');
const router = express.Router();
const { generateQRCode, getUPIDetails } = require('../controllers/qrController');

// Generate QR code for specific payment method
router.get('/:paymentMethod', generateQRCode);

// Get UPI payment details
router.get('/upi/details', getUPIDetails);

module.exports = router;
