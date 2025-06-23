const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const teamAnalyticsController = require("../controllers/teamAnalyticsController");

// Supervisor/team analytics endpoints
router.get("/dashboard", auth, teamAnalyticsController.getTeamDashboard);
router.get("/checklist-progress", auth, teamAnalyticsController.getTeamChecklistProgress);
router.get("/training", auth, teamAnalyticsController.getTeamTrainingAnalytics);
router.get("/feedback", auth, teamAnalyticsController.getTeamFeedbackAnalytics);
router.get("/coaching", auth, teamAnalyticsController.getTeamCoachingAnalytics);

module.exports = router; 