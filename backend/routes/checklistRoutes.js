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
    .isIn(["inkompass", "earlyTalent", "apprenticeship", "academicPlacement", "workExperience", "all"]),
  check("stage", "Invalid stage")
    .optional()
    .isIn(["prepare", "orient", "land", "integrate", "excel", "all"]),
];
const progressValidation = [
  check("isCompleted", "Completion status is required").isBoolean(),
  check("notes", "Notes must be a string").optional().isString(),
];
const assignmentValidation = [
  check("checklistId", "Checklist ID is required").not().isEmpty(),
  check("userId", "User ID is required").not().isEmpty(),
  check("dueDate", "Due date must be a valid date").optional().isISO8601(),
];
const autoAssignRulesValidation = [
  check("programTypes", "Program types must be an array").optional().isArray(),
  check("departments", "Departments must be an array").optional().isArray(),
  check("dueInDays", "Due in days must be a number").optional().isNumeric(),
  check("stages", "Stages must be an array").optional().isArray(),
  check("autoNotify", "Auto notify must be a boolean").optional().isBoolean(),
];
const verificationValidation = [
  check("verificationStatus", "Verification status is required").isIn(["approved", "rejected"]),
  check("verificationNotes", "Verification notes must be a string").optional().isString(),
];

// ─── SPECIFIC NAMED ROUTES (must come BEFORE /:id) ────────────────────────────

// @route   POST /api/checklists/smart-assign
// @desc    Assign to employee / team / department based on role
router.post('/smart-assign', auth, checklistController.smartAssignChecklist);

// @route   GET /api/checklists/user-tasks
// @desc    Supervisor/Manager/HR: get any user's checklist tasks with progress
router.get('/user-tasks', auth, checklistController.getTasksForUser);

// @route   GET /api/checklists/my-tasks
// @desc    Employee: get all assigned checklists with current-period progress
router.get('/my-tasks', auth, checklistController.getMyTasks);

// @route   GET /api/checklists/hr-analytics
// @desc    HR/Manager: org-wide analytics
router.get('/hr-analytics', auth, checklistController.getHRAnalytics);

// @route   GET /api/checklists/assignments
// @desc    Get current user's checklist assignments
router.get("/assignments", auth, checklistController.getUserAssignments);

// @route   GET /api/checklists/assignments/users/:userId
// @desc    Get a specific user's assignments (HR/Manager/Supervisor/Self)
router.get("/assignments/users/:userId", auth, checklistController.getUserAssignments);

// @route   GET /api/checklists/all-items  (debug)
router.get("/all-items", auth, async (req, res) => {
  try {
    const { sequelize } = require("../models");
    const items = await sequelize.query(
      "SELECT id, title, checklistId FROM checklistitems LIMIT 10",
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json({ message: "Sample checklist items", items });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/checklists/items/:id
// @desc    Get a specific checklist item
router.get("/items/:id", auth, checklistController.getChecklistItemById);

// @route   PUT /api/checklists/items/:id
// @desc    Update a checklist item
router.put("/items/:id", [auth,
  check("title", "Title is required").optional().not().isEmpty(),
  check("isRequired", "isRequired must be a boolean").optional().isBoolean(),
  check("orderIndex", "orderIndex must be a number").optional().isNumeric(),
], checklistController.updateChecklistItem);

// @route   DELETE /api/checklists/items/:id
// @desc    Delete a checklist item
router.delete("/items/:id", auth, checklistController.deleteChecklistItem);

// @route   POST /api/checklists/items/:itemId/toggle
// @desc    Toggle a task item done/undone for current period
router.post('/items/:itemId/toggle', auth, checklistController.toggleTaskItem);

// @route   POST /api/checklists/full
// @desc    Create checklist + items in one shot
router.post('/full', auth, checklistController.createChecklistFull);

// @route   POST /api/checklists/assign
// @desc    Assign checklist to user
router.post("/assign", [auth, assignmentValidation], checklistController.assignChecklistToUser);

// @route   PUT /api/checklists/assignments/template/:checklistId
// @desc    Update checklist template
router.put("/assignments/template/:checklistId", [auth,
  check("title", "Title is required").not().isEmpty(),
  check("programType").optional().isIn(["inkompass", "earlyTalent", "apprenticeship", "academicPlacement", "workExperience", "all"]),
  check("stage").optional().isIn(["prepare", "orient", "land", "integrate", "excel", "all"]),
], checklistController.updateChecklistTemplate);

// @route   PUT /api/checklists/progress/:progressId/verify
// @desc    Verify a checklist item
router.put("/progress/:progressId/verify", [auth, verificationValidation], checklistController.verifyChecklistItem);

// @route   POST /api/checklists/send-daily-reminders
router.post('/send-daily-reminders', auth, checkRole('hr', 'manager'), async (req, res) => {
  try {
    const { sendDailyReminders } = require('../scripts/send-daily-checklist-reminders');
    await sendDailyReminders();
    res.json({ message: 'Daily reminders sent' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to send reminders', error: e.message });
  }
});

// ─── GENERIC /:id ROUTES (AFTER all named routes) ─────────────────────────────

// @route   GET /api/checklists
router.get("/", auth, checklistController.getAllChecklists);

// @route   GET /api/checklists/:id
router.get("/:id", auth, checklistController.getChecklistById);

// @route   POST /api/checklists
router.post("/", [auth, checklistValidation], checklistController.createChecklist);

// @route   PUT /api/checklists/:id
router.put("/:id", [auth, checklistValidation], checklistController.updateChecklist);

// @route   DELETE /api/checklists/:id
router.delete("/:id", auth, checklistController.deleteChecklist);

// @route   POST /api/checklists/:id/auto-assign-rules
router.post("/:id/auto-assign-rules", [auth, checkRole("hr", "admin", "rh"), autoAssignRulesValidation], checklistController.addAutoAssignRules);

// @route   GET /api/checklists/:checklistId/progress
router.get("/:checklistId/progress", auth, checklistController.getUserChecklistProgress);

// @route   GET /api/checklists/:checklistId/items
router.get("/:checklistId/items", auth, checklistController.getChecklistItems);

// @route   POST /api/checklists/:checklistId/items
router.post("/:checklistId/items", [auth, check("title", "Title is required").not().isEmpty()], checklistController.addChecklistItem);

// @route   POST /api/checklists/:id/assign-team
router.post('/:id/assign-team', auth, checklistController.assignChecklistToTeam);

module.exports = router;
