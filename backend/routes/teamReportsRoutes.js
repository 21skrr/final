// routes/teamReportsRoutes.js

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Assuming auth middleware is available
const teamReportsController = require('../controllers/teamReportsController');

// Supervisor/Team Reports Endpoints (require authentication and potentially supervisor role check)
// The :teamId parameter is included assuming reports are fetched for a specific team.
router.get('/:teamId/export', auth, teamReportsController.exportTeamReports);
router.get('/:teamId/bottlenecks', auth, teamReportsController.getTeamBottlenecksAnalysis);
router.get('/:teamId/performance', auth, teamReportsController.getTeamPerformanceReports);

module.exports = router; 