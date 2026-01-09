const express = require('express');
const router = express.Router();

// Basic contact routes - can be expanded later
router.get('/', (req, res) => {
  res.json({ message: 'Contact endpoint - to be implemented' });
});

module.exports = router;