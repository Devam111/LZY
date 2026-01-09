const express = require('express');
const router = express.Router();

// Basic quizzes routes - can be expanded later
router.get('/', (req, res) => {
  res.json({ message: 'Quizzes endpoint - to be implemented' });
});

module.exports = router;