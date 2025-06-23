const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checklistController = require("../controllers/checklistController");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const itemValidation = [
  check("title", "Title is required").optional().not().isEmpty(),
  check("isRequired", "isRequired must be a boolean").optional().isBoolean(),
  check("orderIndex", "orderIndex must be a number").optional().isNumeric(),
];

// @route   GET /api/checklist-items
// @desc    Get all checklist items
// @access  Private
router.get("/", auth, checklistController.getAllChecklistItems);

// @route   GET /api/checklist-items/:id
// @desc    Get a specific checklist item
// @access  Private
router.get("/:id", auth, checklistController.getChecklistItemById);

// @route   PUT /api/checklist-items/:id
// @desc    Update a checklist item
// @access  Private (HR/Supervisor)
router.put(
  "/:id",
  [auth, itemValidation],
  checklistController.updateChecklistItem
);

// @route   DELETE /api/checklist-items/:id
// @desc    Delete a checklist item
// @access  Private (HR/Supervisor)
router.delete("/:id", auth, checklistController.deleteChecklistItem);

module.exports = router;
 