const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { onboardingPermissions } = require("../middleware/roleCheck");

const router = express.Router();

// Middleware to ensure employee only accesses tasks for their current phase
const restrictToCurrentPhase = async (req, res, next) => {
  try {
    // Assuming req.user.id is set by auth middleware
    const userId = req.user.id;
    // You may need to adjust the import path for your onboarding progress model
    const OnboardingProgress = require("../models/OnboardingProgress");
    const progress = await OnboardingProgress.findOne({ where: { UserId: userId } });
    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }
    if (progress.stage !== req.params.phase) {
      return res
        .status(403)
        .json({ message: "You can only view tasks for your current phase" });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// --- Employee Routes (Read-only access to their own data) ---

// GET /api/onboarding/progress/me - Get personal onboarding progress
router.get(
  "/progress/me",
  auth,
  onboardingPermissions.employee,
  onboardingController.getMyProgress
);

// GET /api/onboarding/phase/:phase/tasks - Get tasks for a specific phase (Employee only)
router.get(
  "/phase/:phase/tasks",
  auth,
  onboardingPermissions.employee,
  restrictToCurrentPhase,
  onboardingController.getTasksByPhase
);

// GET /api/onboarding/progress/detailed - Get detailed progress (Employee only)
router.get(
  "/progress/detailed",
  auth,
  onboardingPermissions.employee,
  onboardingController.getDetailedProgress
);

// GET /api/onboarding/journey-types - Get available journey types
router.get(
  "/journey-types",
  auth,
  onboardingController.getJourneyTypes
);

// --- Supervisor Routes (Access to direct reports) ---

// GET /api/onboarding/progress/:userId - Get specific user's data (Supervisor/HR)
router.get(
  "/progress/:userId",
  auth,
  onboardingPermissions.supervisorOrHR,
  onboardingController.getUserOnboardingProgress
);

// PUT /api/onboarding/progress/:userId - Update user progress (Supervisor/HR)
router.put(
  "/progress/:userId",
  [
    auth,
    onboardingPermissions.supervisorOrHR,
    check("stage", "Stage is required")
      .optional()
      .isIn(["prepare", "orient", "land", "integrate", "excel"]),
    check("progress", "Progress must be a number between 0 and 100")
      .optional()
      .isInt({ min: 0, max: 100 }),
  ],
  onboardingController.updateUserProgress
);

// PUT /api/onboarding/progress/:userId/advance - Advance to next phase (Supervisor/HR)
router.put(
  "/progress/:userId/advance",
  [auth, onboardingPermissions.canAdvancePhases],
  onboardingController.advanceToNextPhase
);

// PUT /api/onboarding/tasks/:taskId/status - Update task status (Supervisor/HR)
router.put(
  "/tasks/:taskId/status",
  [
    auth,
    onboardingPermissions.canEditTasks,
    check("completed", "Completed status is required").isBoolean(),
    check("hrValidated", "HR validation status is optional")
      .optional()
      .isBoolean(),
  ],
  onboardingController.updateTaskStatus
);

// PUT /api/onboarding/tasks/:taskId/complete - Update completion status (Supervisor/HR)
router.put(
  "/tasks/:taskId/complete",
  [
    auth,
    check("completed", "Completed status is required").isBoolean(),
  ],
  onboardingController.updateTaskCompletion
);

// --- Manager Routes (Read-only access to department data) ---

// GET /api/onboarding/progress/:userId - Get specific user's data (Manager - read-only)
router.get(
  "/progress/:userId/manager",
  auth,
  onboardingPermissions.manager,
  onboardingController.getUserProgress
);

// --- HR Routes (Full access) ---

// GET /api/onboarding/progress - Get all progresses (HR, manager, supervisor)
router.get(
  "/progress",
  auth,
  (req, res, next) => {
    if (["hr", "manager", "supervisor"].includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: "Not authorized" });
  },
  onboardingController.getAllProgresses
);

// GET /api/onboarding/progress/:userId - Get specific user's data (HR)
router.get(
  "/progress/:userId/hr",
  auth,
  onboardingPermissions.hr,
  onboardingController.getUserOnboardingProgress
);

// PUT /api/onboarding/progress/:userId - Update user progress (HR)
router.put(
  "/progress/:userId/hr",
  [
    auth,
    onboardingPermissions.hr,
    check("stage", "Stage is required")
      .optional()
      .isIn(["prepare", "orient", "land", "integrate", "excel"]),
    check("progress", "Progress must be a number between 0 and 100")
      .optional()
      .isInt({ min: 0, max: 100 }),
  ],
  onboardingController.updateUserProgress
);

// PUT /api/onboarding/progress/:userId/advance - Advance to next phase (HR)
router.put(
  "/progress/:userId/advance/hr",
  [auth, onboardingPermissions.hr],
  onboardingController.advanceToNextPhase
);

// PUT /api/onboarding/tasks/:taskId/validate - HR validates a task
router.put(
  "/tasks/:taskId/validate",
  [auth, onboardingPermissions.canValidateTasks],
  onboardingController.validateTask
);

// POST /api/onboarding/assign - HR assigns checklists
router.post(
  "/assign",
  [
    auth,
    onboardingPermissions.hr,
    check("userId", "User ID is required").exists(),
    check("checklistIds", "Checklist IDs must be an array").isArray(),
  ],
  onboardingController.assignChecklists
);

// POST /api/onboarding/:userId/reset - Reset journey (HR only)
router.post(
  "/:userId/reset",
  [
    auth,
    // Allow HR, manager, or supervisor to reset journey
    (req, res, next) => {
      if (["hr", "manager", "supervisor"].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ message: "Not authorized" });
    },
    check("resetToStage", "Stage is invalid")
      .optional()
      .isIn(["pre_onboarding", "phase_1", "phase_2"]),
  ],
  onboardingController.resetJourney
);

// DELETE /api/onboarding/:userId - Delete progress (HR only)
router.delete(
  "/:userId",
  [
    auth,
    (req, res, next) => {
      if (["hr", "manager", "supervisor"].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ message: "Not authorized" });
    },
  ],
  onboardingController.deleteUserProgress
);

// GET /api/onboarding/export/csv - Export CSV (HR only)
router.get(
  "/export/csv",
  [
    auth,
    (req, res, next) => {
      if (["hr", "manager", "supervisor"].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ message: "Not authorized" });
    },
  ],
  onboardingController.exportOnboardingCSV
);

// POST /api/onboarding/create - Create new journey (HR only)
router.post(
  "/create",
  [
    auth,
    onboardingPermissions.hr,
    check("userId", "User ID is required").not().isEmpty(),
    check("journeyType", "Journey type is required").isIn(["SFP", "CC"]),
    check("templateId", "Template ID is optional").optional().not().isEmpty(),
  ],
  onboardingController.createJourney
);

// GET /api/onboarding/tasks/default - Get default tasks (Employee/HR)
router.get(
  "/tasks/default",
  auth,
  onboardingPermissions.employee,
  onboardingController.getDefaultTasks
);

// PUT /api/onboarding/user-task-progress/:userTaskProgressId/validate - Validate user task progress
router.put(
  "/user-task-progress/:userTaskProgressId/validate",
  auth,
  onboardingController.validateUserTaskProgress
);

// GET /api/onboarding/debug/:userId/phase1 - Debug Phase 1 status (for testing)
router.get("/debug/:userId/phase1", auth, onboardingController.debugPhase1Status);

module.exports = router;
