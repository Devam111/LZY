const express = require('express');
const router = express.Router();
const { loginStudent, loginFaculty, me } = require('../controllers/authController');
const auth = require('../middleware/auth');
const {
  validateLogin,
  rateLimit,
  securityHeaders,
  requestLogger,
  errorHandler
} = require('../middleware/signupMiddleware');

// Apply security headers and logging to all routes
router.use(securityHeaders);
router.use(requestLogger);

// Login endpoints with rate limiting and validation
router.post('/student/login',
  rateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  validateLogin,
  loginStudent
);

router.post('/faculty/login',
  rateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  validateLogin,
  loginFaculty
);

// Legacy endpoints for backward compatibility
router.post('/login/student', 
  rateLimit(15 * 60 * 1000, 10),
  validateLogin,
  loginStudent
);
router.post('/login/faculty', 
  rateLimit(15 * 60 * 1000, 10),
  validateLogin,
  loginFaculty
);

// Protected routes (require authentication)
router.get('/profile', auth(), me);

// Error handling middleware (must be last)
router.use(errorHandler);

module.exports = router;


