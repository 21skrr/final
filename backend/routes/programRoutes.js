const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const programController = require("../controllers/programController");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const programValidation = [
  check("name", "Program name is required").not().isEmpty(),
  check("description", "Description is required").not().isEmpty(),
  check("type", "Program type is required").isIn([
    "inkompass",
    "earlyTalent",
    "apprenticeship",
    "academicPlacement",
    "workExperience",
  ]),
  check("startDate", "Start date is required").isISO8601(),
  check("endDate", "End date is required").isISO8601(),
  check("capacity", "Capacity must be a positive number").isInt({ min: 1 }),
];

// @route   GET /api/programs
// @desc    Get all programs
// @access  Private
router.get("/", auth, programController.getAllPrograms);

// @route   GET /api/programs/:id
// @desc    Get program by ID
// @access  Private
router.get("/:id", auth, programController.getProgramById);

// @route   POST /api/programs
// @desc    Create new program
// @access  Private (Admin/HR)
router.post(
  "/",
  [auth, checkRole("hr"), programValidation],
  programController.createProgram
);

// @route   PUT /api/programs/:id
// @desc    Update program
// @access  Private (Admin/HR)
router.put(
  "/:id",
  [auth, checkRole("hr"), programValidation],
  programController.updateProgram
);

// @route   DELETE /api/programs/:id
// @desc    Delete program
// @access  Private (Admin)
router.delete("/:id", auth, checkRole("hr"), programController.deleteProgram);

module.exports = router;
