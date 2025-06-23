const express = require("express");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const supervisorController = require("../controllers/supervisorController");
const evaluationController = require("../controllers/evaluationController");

const router = express.Router();

// View Team Members' Progress
// GET /api/supervisor/team/onboarding
router.get(
  "/team/onboarding",
  auth,
  roleCheck(["supervisor", "manager", "hr"]),
  supervisorController.getTeamOnboardingProgress
);

// GET /api/supervisors/:supervisorId/evaluations - Get evaluations created by a specific supervisor
router.get(
  "/:supervisorId/evaluations", // This path is relative to where the router is mounted (/api/supervisor)
  auth,
  roleCheck(["supervisor", "hr", "manager"]), // Adjust roles as needed
  evaluationController.getEvaluatorEvaluations // Use the evaluation controller function
);

// Review Dashboard
// GET /api/supervisor/dashboard/onboarding
router.get(
  "/dashboard/onboarding",
  auth,
  roleCheck(["supervisor", "manager", "hr"]),
  supervisorController.getOnboardingDashboard
);

module.exports = router;
