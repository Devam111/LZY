const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getMyEnrollments,
  enrollInCourse,
  getEnrollmentDetails,
  updateProgress,
  dropEnrollment,
  getCourseEnrollments
} = require('../controllers/enrollmentController');

// Get my enrollments
router.get('/my-enrollments', auth(), getMyEnrollments);

// Enroll in a course (by courseId in body)
router.post('/', auth(), enrollInCourse);

// Enroll in a course (by courseId in URL)
router.post('/enroll/:courseId', auth(), enrollInCourse);

// Get enrollment details
router.get('/:enrollmentId', auth(), getEnrollmentDetails);

// Update enrollment progress
router.put('/:enrollmentId/progress', auth(), updateProgress);

// Drop enrollment
router.delete('/:enrollmentId', auth(), dropEnrollment);

// Get course enrollments (for faculty)
router.get('/course/:courseId', auth(['faculty']), getCourseEnrollments);

module.exports = router;