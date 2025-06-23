const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checklistController = require("../controllers/checklistController");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const checklistValidation = [
  check("title", "Title is required").not().isEmpty(),
  check("programType", "Invalid program type")
    .optional()
    .isIn([
      "inkompass",
      "earlyTalent",
      "apprenticeship",
      "academicPlacement",
      "workExperience",
      "all",
    ]),
  check("stage", "Invalid stage")
    .optional()
    .isIn(["prepare", "orient", "land", "integrate", "excel", "all"]),
];

// Progress validation middleware
const progressValidation = [
  check("isCompleted", "Completion status is required").isBoolean(),
  check("notes", "Notes must be a string").optional().isString(),
];

// Assignment validation middleware
const assignmentValidation = [
  check("checklistId", "Checklist ID is required").not().isEmpty(),
  check("userId", "User ID is required").not().isEmpty(),
  check("dueDate", "Due date must be a valid date").optional().isISO8601(),
];

// Auto-assign rules validation middleware
const autoAssignRulesValidation = [
  check("programTypes", "Program types must be an array").optional().isArray(),
  check("departments", "Departments must be an array").optional().isArray(),
  check("dueInDays", "Due in days must be a number").optional().isNumeric(),
  check("stages", "Stages must be an array").optional().isArray(),
  check("autoNotify", "Auto notify must be a boolean").optional().isBoolean(),
];

// Verification validation middleware
const verificationValidation = [
  check("verificationStatus", "Verification status is required").isIn([
    "approved",
    "rejected",
  ]),
  check("verificationNotes", "Verification notes must be a string")
    .optional()
    .isString(),
];

// @route   GET /api/checklists
// @desc    Get all checklists
// @access  Private
router.get("/", auth, checklistController.getAllChecklists);

// @route   GET /api/checklists/:id
// @desc    Get checklist by ID
// @access  Private
router.get("/:id", auth, checklistController.getChecklistById);

// @route   POST /api/checklists
// @desc    Create checklist
// @access  Private (HR/Supervisor)
router.post(
  "/",
  [auth, checklistValidation],
  checklistController.createChecklist
);

// @route   PUT /api/checklists/:id
// @desc    Update checklist
// @access  Private (HR/Supervisor)
router.put(
  "/:id",
  [auth, checklistValidation],
  checklistController.updateChecklist
);

// @route   DELETE /api/checklists/:id
// @desc    Delete checklist
// @access  Private (HR/Supervisor)
router.delete("/:id", auth, checklistController.deleteChecklist);

// @route   PUT /api/checklists/items/:id
// @desc    Update a checklist item directly
// @access  Private (HR/Supervisor)
router.put(
  "/items/:id",
  [
    auth,
    check("title", "Title is required").optional().not().isEmpty(),
    check("isRequired", "isRequired must be a boolean").optional().isBoolean(),
    check("orderIndex", "orderIndex must be a number").optional().isNumeric(),
  ],
  checklistController.updateChecklistItem
);

// @route   GET /api/checklists/items/:id
// @desc    Get a specific checklist item
// @access  Private
router.get("/items/:id", auth, checklistController.getChecklistItemById);

// @route   POST /api/checklists/:id/auto-assign-rules
// @desc    Add auto-assignment rules to a checklist
// @access  Private (HR only)
router.post(
  "/:id/auto-assign-rules",
  [
    auth,
    (req, res, next) => {
      console.log("Route middleware - User role:", req.user.role);
      console.log("Expected roles: hr, admin, rh");
      next();
    },
    checkRole("hr", "admin", "rh"),
    autoAssignRulesValidation,
  ],
  checklistController.addAutoAssignRules
);

// @route   GET /api/checklists/:checklistId/progress
// @desc    Get current user's progress on a checklist
// @access  Private
router.get(
  "/:checklistId/progress",
  auth,
  checklistController.getUserChecklistProgress
);

// @route   GET /api/checklists/:checklistId/items
// @desc    Get all items for a specific checklist
// @access  Private
router.get("/:checklistId/items", auth, checklistController.getChecklistItems);

// @route   POST /api/checklists/:checklistId/items
// @desc    Add an item to a checklist
// @access  Private (HR/Supervisor)
router.post(
  "/:checklistId/items",
  [
    auth,
    check("title", "Title is required").not().isEmpty(),
    check("isRequired", "isRequired must be a boolean").optional().isBoolean(),
  ],
  checklistController.addChecklistItem
);

// @route   GET /api/checklists/assignments
// @desc    Get current user's checklist assignments
// @access  Private
router.get("/assignments", auth, checklistController.getUserAssignments);

// @route   GET /api/checklists/assignments/users/:userId
// @desc    Get a user's checklist assignments
// @access  Private (HR/Supervisor/Self)
router.get(
  "/assignments/users/:userId",
  auth,
  checklistController.getUserAssignments
);

// @route   PUT /api/checklists/progress/:progressId/verify
// @desc    Verify a checklist item
// @access  Private (HR/Supervisor)
router.put(
  "/progress/:progressId/verify",
  [auth, verificationValidation],
  checklistController.verifyChecklistItem
);

// @route   POST /api/checklists/assign
// @desc    Assign checklist to user
// @access  Private (HR/Supervisor)
router.post(
  "/assign",
  [auth, assignmentValidation],
  checklistController.assignChecklistToUser
);

// @route   GET /api/checklists/all-items
// @desc    Get all checklist items to debug ID format
// @access  Private
router.get("/all-items", auth, async (req, res) => {
  try {
    // Get a limited number of items for debugging
    const { sequelize } = require("../models");
    const items = await sequelize.query(
      "SELECT id, title, checklistId FROM checklistitems LIMIT 10",
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      message: "Sample checklist items with their IDs for debugging",
      items,
    });
  } catch (error) {
    console.error("Error fetching checklist items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
