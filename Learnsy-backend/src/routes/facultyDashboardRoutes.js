const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getFacultyOverview,
  getFacultyCourses,
  getCourseAnalytics
} = require('../controllers/facultyDashboardController');

// Apply authentication middleware to all routes
router.use(auth());

// GET /api/faculty-dashboard - Get faculty dashboard overview
router.get('/', getFacultyOverview);

// GET /api/faculty-dashboard/courses - Get faculty courses with stats
router.get('/courses', getFacultyCourses);

// GET /api/faculty-dashboard/courses/:courseId/analytics - Get course analytics
router.get('/courses/:courseId/analytics', getCourseAnalytics);

module.exports = router;
