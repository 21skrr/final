const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Assuming auth middleware is needed
const {
  getCompletedTasksReport,
  getAttendedSessionsReport,
  getSubmittedFeedbackReport,
  getIndividualPerformanceSummary,
} = require('../controllers/personalReportsController');

// Personal reports routes
router.get('/tasks', auth, getCompletedTasksReport);
router.get('/sessions', auth, getAttendedSessionsReport);
router.get('/feedback', auth, getSubmittedFeedbackReport);
router.get('/performance', auth, getIndividualPerformanceSummary);

module.exports = router; 