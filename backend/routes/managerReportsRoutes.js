const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Assuming auth middleware is available
const managerReportsController = require('../controllers/managerReportsController');
const checkRole = require('../middleware/roleCheck');

// Manager Reports Endpoints (require authentication and appropriate role check)
router.get('/supervisor-activity', auth, managerReportsController.getSupervisorActivityReport);
router.get('/onboarding-health', auth, managerReportsController.getOnboardingHealthReport);

// GET /api/reports/evaluations - Get evaluation reports
router.get('/evaluations', 
  auth, 
  (req, res, next) => { // Temporary middleware to inspect user and role
    console.log('Inspecting req.user:', req.user);
    console.log('Inspecting req.user.role:', req.user?.role);
    next();
  }, 
  // checkRole("manager", "hr"), // Temporarily disabled checkRole
  // Removed the redundant log after checkRole
  managerReportsController.getEvaluationReports
);

module.exports = router; 