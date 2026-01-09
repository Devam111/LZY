const express = require('express');
const router = express.Router();
const { getStudentDashboard } = require('../controllers/studentDashboardController');
const auth = require('../middleware/auth');

router.get('/', auth(), getStudentDashboard);

module.exports = router;
