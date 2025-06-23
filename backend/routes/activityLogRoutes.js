const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const activityLogController = require('../controllers/activityLogController');

// @route   GET /api/activitylogs
// @desc    View all system actions (filter by user, date, action type)
// @access  Private (HR, Admin)
router.get('/', auth, checkRole('hr', 'admin'), activityLogController.getActivityLogs);

module.exports = router; 