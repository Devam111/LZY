const express = require('express');
const router = express.Router();

// Basic progress routes - can be expanded later
router.get('/', (req, res) => {
  res.json({ message: 'Progress endpoint - to be implemented' });
});

module.exports = router;