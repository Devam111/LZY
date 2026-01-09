const express = require('express');
const router = express.Router();

// Basic feedback routes - can be expanded later
router.get('/', (req, res) => {
  res.json({ message: 'Feedback endpoint - to be implemented' });
});

module.exports = router;