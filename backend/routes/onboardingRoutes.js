const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// --- Onboarding Progress Routes ---

// GET /api/onboarding/progress - Get all progresses (HR only)
router.get("/progress", auth, roleCheck(["hr"]), onboardingController.getAllProgresses);

// GET /api/onboarding/progress/me - Get personal onboarding progress
router.get("/progress/me", auth, onboardingController.getMyProgress);

// GET /api/onboarding/progress/:userId - Get specific user's data (HR/Supervisor)
router.get("/progress/:userId", auth, onboardingController.getUserProgress);

// GET /api/onboarding/progress/:userId - Get auto-calculated progress
router.get('/progress/:userId', auth, onboardingController.getUserOnboardingProgress);

// Get detailed progress for all phases and tasks
router.get('/progress/detailed', auth, onboardingController.getDetailedProgress);

// GET /api/onboarding/phase/:phase/tasks - Get tasks for a specific phase
router.get('/phase/:phase/tasks', auth, onboardingController.getTasksByPhase);

// PUT /api/onboarding/progress/:userId - Update progress (HR only)
router.put(
  "/progress/:userId",
  [
    auth,
    roleCheck(["hr"]),
    check("stage", "Stage is invalid").optional().isIn(["prepare", "orient", "land", "integrate", "excel"]),
    check("progress", "Progress must be a number").optional().isInt({ min: 0, max: 100 }),
  ],
  onboardingController.updateUserProgress
);

// PUT /api/onboarding/progress/:userId/advance - Advance to next phase
router.put(
  '/progress/:userId/advance',
  auth,
  roleCheck(['hr', 'manager']),
  onboardingController.advanceToNextPhase
);

// --- Onboarding Task Routes ---

// PUT /api/onboarding/tasks/:taskId/status - Update task status
router.put(
  "/tasks/:taskId/status",
  auth,
  onboardingController.updateTaskStatus
);

// PUT /api/onboarding/tasks/:taskId/validate - HR validates a task
router.put('/tasks/:taskId/validate', auth, roleCheck(['hr']), onboardingController.validateTask);

// PUT /api/onboarding/tasks/:taskId/complete - Update completion status
router.put('/tasks/:taskId/complete', auth, onboardingController.updateTaskCompletion);

// --- Other Onboarding Routes ---

// POST /api/onboarding/assign - HR assigns checklists
router.post(
  "/assign",
  [
    auth,
    roleCheck(["hr"]),
    check("userId", "User ID is required").exists(),
    check("checklistIds", "Checklist IDs must be an array").isArray(),
  ],
  onboardingController.assignChecklists
);

// POST /api/onboarding/:userId/reset - Reset journey
router.post(
  "/:userId/reset",
  [
    auth,
    roleCheck(["hr"]),
    check("resetToStage", "Stage is invalid").optional().isIn(["prepare", "orient", "land", "integrate", "excel"]),
  ],
  onboardingController.resetJourney
);

// DELETE /api/onboarding/:userId - Delete progress
router.delete(
  "/:userId",
  auth,
  roleCheck(["hr"]),
  onboardingController.deleteUserProgress
);

// GET /api/onboarding/export/csv - Export CSV
router.get(
  "/export/csv",
  auth,
  roleCheck(["hr"]),
  onboardingController.exportOnboardingCSV
);

// POST /api/onboarding/create - Create new journey
router.post(
  '/create',
  auth,
  roleCheck(['hr']),
  onboardingController.createJourney
);

// GET /api/onboarding/tasks/default - Get default tasks
router.get("/tasks/default", auth, onboardingController.getDefaultTasks);

module.exports = router;