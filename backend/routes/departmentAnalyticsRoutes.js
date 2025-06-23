const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const departmentAnalyticsController = require("../controllers/departmentAnalyticsController");

// Manager/department analytics endpoints
router.get("/dashboard", auth, departmentAnalyticsController.getDepartmentDashboard);
router.get("/onboarding-kpi", auth, departmentAnalyticsController.getDepartmentOnboardingKPI);
router.get("/probation", auth, departmentAnalyticsController.getDepartmentProbation);
router.get("/evaluations", auth, departmentAnalyticsController.getDepartmentEvaluations);
router.get("/feedback", auth, departmentAnalyticsController.getDepartmentFeedback);

module.exports = router; 