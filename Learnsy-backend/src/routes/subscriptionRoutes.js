const express = require('express');
const router = express.Router();
const {
  processPayment,
  getCurrentSubscription,
  checkAccess,
  checkVideoAccess,
  checkDocumentAccess,
  cancelSubscription,
  getPlans
} = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/plans', getPlans);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post('/process-payment', processPayment);
router.get('/current', getCurrentSubscription);
router.get('/check-access/:feature', checkAccess);
router.get('/check-video-access/:videoIndex', checkVideoAccess);
router.get('/check-document-access/:documentIndex', checkDocumentAccess);
router.post('/cancel', cancelSubscription);

module.exports = router;
