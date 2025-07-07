const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checklistController = require("../controllers/checklistController");
const { auth, checkRole } = require("../middleware/auth");
const { getChecklistProgressByUserAndChecklist } = require('../controllers/checklistController');

// Validation middleware
const assignmentValidation = [
  check("userId", "User ID is required").not().isEmpty(),
  check("checklistId", "Checklist ID is required").not().isEmpty(),
  check("dueDate", "Due date must be a valid date").optional().isISO8601(),
  check("isAutoAssigned", "isAutoAssigned must be a boolean")
    .optional()
    .isBoolean(),
];

const bulkAssignmentValidation = [
  check("checklistId", "Checklist ID is required").not().isEmpty(),
  check("userIds", "User IDs must be an array").isArray(),
  check("dueDate", "Due date must be a valid date").optional().isISO8601(),
  check("isAutoAssigned", "isAutoAssigned must be a boolean")
    .optional()
    .isBoolean(),
];

// @route   POST /api/checklist-assignments
// @desc    Assign a checklist to a user
// @access  Private (HR/Supervisor)
router.post(
  "/",
  [auth, assignmentValidation],
  checklistController.assignChecklistToUser
);

// @route   POST /api/checklist-assignments/bulk
// @desc    Assign a checklist to multiple users
// @access  Private (HR/Supervisor)
router.post(
  "/bulk",
  [auth, bulkAssignmentValidation],
  checklistController.bulkAssignChecklist
);

// @route   GET /api/checklist-assignments/user/:userId
// @desc    Get checklist assignments for a specific user
// @access  Private (HR/Supervisor or the user themselves)
router.get("/user/:userId", auth, checklistController.getUserAssignments);

// @route   GET /api/checklist-assignments/my
// @desc    Get the current user's assignments
// @access  Private
router.get("/my", auth, checklistController.getUserAssignments);

// @route   GET /api/checklist-assignments/department/:department
// @desc    Get checklist assignments for a specific department
// @access  Private (HR/Supervisor)
router.get(
  "/department/:department",
  auth,
  checklistController.getAssignmentsByDepartment
);

// @route   GET /api/checklist-assignments/:assignmentId/items
// @desc    Get all items for a given checklist assignment
// @access  Private
router.get(
  "/:assignmentId/items",
  auth,
  checklistController.getAssignmentItems
);

// @route   GET /api/checklist-assignments/:assignmentId/progress
// @desc    Get all progress records for a given checklist assignment
// @access  Private
router.get(
  "/:assignmentId/progress",
  auth,
  checklistController.getAssignmentProgress
);

// @route   GET /api/checklist-assignments/team/:teamId
// @desc    Get checklist assignments for a specific team
// @access  Private (Supervisor/HR)
router.get("/team/:teamId", auth, checklistController.getAssignmentsByTeam);

// @route   PATCH /api/checklist-progress/:progressId/verify
// @desc    Verify a checklist item
// @access  Private (HR/Manager)
router.patch(
  "/checklist-progress/:progressId/verify",
  auth,
  checklistController.verifyChecklistItem
);

// @route   PATCH /api/checklist-progress/:progressId
// @desc    Update checklist progress (completion, notes, etc)
// @access  Private
router.patch(
  "/checklist-progress/:progressId",
  auth,
  checklistController.updateChecklistProgress
);

// @route   GET /api/checklist-assignments/progress/:userId/:checklistId
// @desc    Get checklist progress for a specific user and checklist
// @access  Private
router.get('/progress/:userId/:checklistId', getChecklistProgressByUserAndChecklist);

module.exports = router;
