const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminDashboardController');
const auth = require('../middleware/auth');

router.get('/', auth('faculty'), getAdminDashboard);

module.exports = router;
