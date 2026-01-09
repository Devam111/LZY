const express = require('express');
const router = express.Router();

// Basic pricing routes - can be expanded later
router.get('/', (req, res) => {
  res.json({ message: 'Pricing endpoint - to be implemented' });
});

module.exports = router;