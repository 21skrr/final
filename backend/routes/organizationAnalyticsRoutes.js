const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getOrganizationDashboard,
  getCompletionRates,
  getFeedbackParticipation,
  getSurveyTrends,
  getTrainingCompletion,
  getEvaluationEffectiveness,
  getUserAnalytics,
  getProgramAnalytics,
  getOrganizationKPIs
} = require('../controllers/organizationAnalyticsController');

// HR organization-wide analytics routes
router.get('/dashboard', auth, getOrganizationDashboard);
router.get('/completion-rates', auth, getCompletionRates);
router.get('/feedback-participation', auth, getFeedbackParticipation);
router.get('/survey-trends', auth, getSurveyTrends);
router.get('/training-completion', auth, getTrainingCompletion);
router.get('/evaluation-effectiveness', auth, getEvaluationEffectiveness);

// User-specific analytics route
router.get('/user/:userId', auth, getUserAnalytics);

// Program-specific analytics route
router.get('/program/:programId', auth, getProgramAnalytics);

// Organization-wide KPIs route (Placeholder)
router.get('/kpi', auth, getOrganizationKPIs);

module.exports = router;
 