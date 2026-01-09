const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getStudentOverview,
  getCourseProgress,
  updateCourseProgress,
  getStudyAnalytics,
  getAchievements
} = require('../controllers/progressController');

// Get student overview with aggregated stats
router.get('/student-overview', auth(), getStudentOverview);

// Get detailed progress for a specific course
router.get('/course/:courseId', auth(), getCourseProgress);

// Update progress for a course
router.put('/course/:courseId', auth(), updateCourseProgress);

// Get study analytics
router.get('/analytics', auth(), getStudyAnalytics);

// Get achievements
router.get('/achievements', auth(), getAchievements);

module.exports = router;
