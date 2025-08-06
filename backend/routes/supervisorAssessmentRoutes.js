// routes/supervisorAssessmentRoutes.js
const express = require("express");
const router = express.Router();
const supervisorAssessmentController = require("../controllers/supervisorAssessmentController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Initialize assessment when Phase 1 is completed
router.post(
  "/initialize/:userId",
  auth,
  roleCheck(["supervisor", "manager", "hr"]),
  supervisorAssessmentController.initializeAssessment
);

// Get assessments pending HR approval - MUST come before /:assessmentId
router.get(
  "/pending-hr-approval",
  auth,
  roleCheck(["hr"]),
  supervisorAssessmentController.getPendingHRApproval
);

// Get assessments by supervisor - MUST come before /:assessmentId
router.get(
  "/supervisor/:supervisorId",
  auth,
  roleCheck(["supervisor", "manager", "hr"]),
  supervisorAssessmentController.getSupervisorAssessments
);

// Upload certificate
router.post(
  "/:assessmentId/upload-certificate",
  auth,
  roleCheck(["supervisor", "manager"]),
  supervisorAssessmentController.upload.single("certificate"),
  supervisorAssessmentController.uploadCertificate
);

// Conduct assessment
router.post(
  "/:assessmentId/conduct-assessment",
  auth,
  roleCheck(["supervisor", "manager"]),
  supervisorAssessmentController.conductAssessment
);

// Make supervisor decision
router.post(
  "/:assessmentId/make-decision",
  auth,
  roleCheck(["supervisor", "manager"]),
  supervisorAssessmentController.makeDecision
);

// HR approval
router.post(
  "/:assessmentId/hr-approve",
  auth,
  roleCheck(["hr"]),
  supervisorAssessmentController.hrApprove
);

// Get assessment details - MUST come last
router.get(
  "/:assessmentId",
  auth,
  supervisorAssessmentController.getAssessment
);

module.exports = router; 