// routes/hrAssessmentRoutes.js
const express = require("express");
const router = express.Router();
const hrAssessmentController = require("../controllers/hrAssessmentController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Get pending HR assessments - MUST come before /:assessmentId
router.get(
  "/pending",
  auth,
  roleCheck(["hr"]),
  hrAssessmentController.getPendingHRAssessments
);

// Get HR assessments by HR user - MUST come before /:assessmentId
router.get(
  "/hr/:hrId",
  auth,
  roleCheck(["hr"]),
  hrAssessmentController.getHRAssessments
);

// Initialize HR assessment when Phase 2 is completed
router.post(
  "/initialize/:userId",
  auth,
  roleCheck(["hr"]),
  hrAssessmentController.initializeHRAssessment
);

// Conduct HR assessment
router.post(
  "/:assessmentId/conduct-assessment",
  auth,
  roleCheck(["hr"]),
  hrAssessmentController.conductAssessment
);

// Make HR decision
router.post(
  "/:assessmentId/make-decision",
  auth,
  roleCheck(["hr"]),
  hrAssessmentController.makeDecision
);

// Get HR assessment details - MUST come last
router.get(
  "/:assessmentId",
  auth,
  roleCheck(["hr"]),
  hrAssessmentController.getAssessment
);

module.exports = router; 