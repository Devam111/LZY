const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  startStudySession,
  updateStudySession,
  endStudySession,
  getActiveStudySession,
  getStudySessionHistory,
  getLiveStudyStats
} = require('../controllers/studySessionController');

// Start a new study session
router.post('/start', auth(), startStudySession);

// Update study session activity
router.put('/:sessionId/update', auth(), updateStudySession);

// End study session
router.put('/:sessionId/end', auth(), endStudySession);

// Get active study session
router.get('/active', auth(), getActiveStudySession);

// Get study session history
router.get('/history', auth(), getStudySessionHistory);

// Get live study statistics
router.get('/stats', auth(), getLiveStudyStats);

module.exports = router;