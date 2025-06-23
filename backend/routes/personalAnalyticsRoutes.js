const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getPersonalDashboard,
  getPersonalChecklistAnalytics,
  getPersonalFeedbackAnalytics,
  getPersonalOnboardingAnalytics,
  getPersonalTrainingAnalytics
} = require("../controllers/personalAnalyticsController");

// Personal analytics routes
router.get("/dashboard", auth, getPersonalDashboard);
router.get("/onboarding", auth, getPersonalOnboardingAnalytics);
router.get("/checklist", auth, getPersonalChecklistAnalytics);
router.get("/training", auth, getPersonalTrainingAnalytics);
router.get("/feedback", auth, getPersonalFeedbackAnalytics);

module.exports = router; 