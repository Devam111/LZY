
const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');
const auth = require('../middleware/auth');
const {
  validateStudentSignup,
  validateFacultySignup,
  validateLogin,
  rateLimit,
  securityHeaders,
  requestLogger,
  errorHandler
} = require('../middleware/signupMiddleware');

// Apply security headers and logging to all routes
router.use(securityHeaders);
router.use(requestLogger);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Signup API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Clear rate limit cache endpoint (for development)
router.post('/clear-rate-limit', (req, res) => {
  const { clearRateLimitCache } = require('../middleware/signupMiddleware');
  clearRateLimitCache();
  res.json({
    success: true,
    message: 'Rate limit cache cleared'
  });
});

// Student Registration Routes
router.post('/student/register', 
  rateLimit(15 * 60 * 1000, 100), // 100 attempts per 15 minutes (development friendly)
  validateStudentSignup,
  signupController.registerStudent
);

router.post('/student/login',
  rateLimit(15 * 60 * 1000, 100), // 100 attempts per 15 minutes
  validateLogin,
  signupController.loginStudent
);

// Faculty Registration Routes
router.post('/faculty/register',
  rateLimit(15 * 60 * 1000, 100), // 100 attempts per 15 minutes
  validateFacultySignup,
  signupController.registerFaculty
);

router.post('/faculty/login',
  rateLimit(15 * 60 * 1000, 100), // 100 attempts per 15 minutes
  validateLogin,
  signupController.loginFaculty
);

// Protected Routes (require authentication)
router.get('/profile', auth(), signupController.getUserProfile);
router.put('/profile', auth(), signupController.updateProfile);

// Admin/Stats Routes (require authentication)
router.get('/stats', auth(), signupController.getSignupStats);

// Error handling middleware (must be last)
router.use(errorHandler);

module.exports = router;
