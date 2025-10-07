const express = require("express");
const { check } = require("express-validator");
const evaluationController = require("../controllers/evaluationController");
const { auth, checkRole, isRH } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const evaluationValidation = [
  check("title", "Title is required").not().isEmpty(),
  check("type", "Evaluation type is required").isIn([
    "3-month",
    "6-month",
    "12-month",
    "training",
    "general",
    "performance"
  ]),
  check("criteria", "Criteria must be an array").isArray(),
  check("criteria.*.name", "Criteria name is required").not().isEmpty(),
  // Removed validation for weight as it's not in the DB schema
  // check("criteria.*.weight", "Criteria weight is required").isFloat({
  //   min: 0,
  //   max: 1,
  // }),
  // Removed validation for description as it's not in the DB schema
  // check("criteria.*.description", "Criteria description is required")
  //   .not()
  //   .isEmpty(),
];

// GET /api/evaluations/user
router.get("/user", auth, evaluationController.getUserEvaluations);

// GET /api/evaluations/supervisor
router.get(
  "/supervisor",
  auth,
  checkRole("supervisor", "hr"),
  evaluationController.getSupervisorEvaluations
);

// GET /api/evaluations/review
router.get(
  "/review",
  auth,
  checkRole("manager", "hr"),
  evaluationController.getReviewEvaluations
);

// GET /api/evaluations/:id
router.get("/:id", auth, checkRole("employee", "supervisor", "hr", "manager"), evaluationController.getEvaluationById);

// GET /api/evaluations
router.get("/", auth, checkRole("supervisor", "hr", "manager"), evaluationController.getAllEvaluations);

// POST /api/evaluations
router.post(
  "/",
  [auth, checkRole("hr", "supervisor"), evaluationValidation],
  evaluationController.createEvaluation
);

// PUT /api/evaluations/:id
router.put(
  "/:id",
  [auth, checkRole("employee", "hr", "supervisor"), evaluationValidation],
  evaluationController.updateEvaluation
);

// PATCH /api/evaluations/:id/validate - Validate or approve an evaluation
router.patch(
  "/:id/validate",
  [auth, checkRole("manager", "hr")], // Only managers and HR can validate/approve
  evaluationController.validateEvaluation
);

// DELETE /api/evaluations/:id
router.delete(
  "/:id",
  [auth, checkRole("hr", "supervisor")],
  evaluationController.deleteEvaluation
);

// Employee actions
router.patch(
  "/:id/comment",
  [
    auth,
    checkRole("employee"),
    check("comment", "Comment must be a string").isString().notEmpty(),
  ],
  evaluationController.addEmployeeComment
);

// Supervisor/HR actions - Update evaluation comments
router.patch(
  "/:id/comments",
  [
    auth,
    checkRole("supervisor", "hr"),
    check("comments", "Comments must be a string").isString(),
  ],
  evaluationController.updateEvaluationComments
);

// Evaluation submissions
router.patch(
  "/:id/submit",
  [
    auth,
    check("scores", "Scores must be an array").isArray(),
    check("scores.*.criteriaId", "Criteria ID is required").not().isEmpty(),
    check("scores.*.score", "Score must be between 1 and 5").isInt({
      min: 1,
      max: 5,
    }),
    check("scores.*.comments", "Comments are required").not().isEmpty(),
  ],
  evaluationController.submitEvaluation
);

// GET /api/evaluations/export/csv (HR only)
router.get("/export/csv", auth, isRH, evaluationController.exportEvaluationCSV);

// GET /api/evaluations/:id/export?format=csv - Export a single evaluation as CSV
router.get(
  "/:id/export",
  auth,
  isRH,
  evaluationController.exportSingleEvaluationCSV
);

// POST /api/evaluations/:evaluationId/criteria
router.post(
  "/:evaluationId/criteria",
  [
    auth,
    checkRole("supervisor", "hr", "manager"), // Assuming supervisors can add criteria
    check("category", "Category is required").not().isEmpty(),
    check("name", "Criteria name is required").not().isEmpty(),
    // check("weight", "Criteria weight is required and must be a float").isFloat({ min: 0, max: 1 }), // Add if weight is required for individual criteria
    check("rating", "Rating is required and must be a number").isNumeric(), // Or isInt with min/max if rating is on a scale
    check("comments", "Comments are required").not().isEmpty()
  ],
  evaluationController.addEvaluationCriteria
);

// GET /api/evaluations/:evaluationId/criteria - View evaluation criteria entries by evaluation ID
router.get(
  "/:evaluationId/criteria",
  auth,
  checkRole("supervisor", "hr", "manager", "employee"), // Assuming relevant roles can view criteria
  evaluationController.getEvaluationCriteriaByEvaluationId
);

// PUT /api/evaluations/:id/criteria - Update evaluation criterion (using evaluation ID in path, criterion ID in body)
router.put(
  "/:id/criteria",
  [
    auth,
    checkRole("supervisor", "hr", "manager"),
    check("id", "Criteria ID is required in body").not().isEmpty(), // Expecting criterion ID in the body for this route structure
    check("rating", "Rating is required and must be a number").isNumeric(),
    // Include other validation for category, name, comments if they can be updated via this route
  ],
  evaluationController.updateEvaluationCriteria
);

// Get employee evaluations
router.get(
  "/employee/:employeeId",
  auth,
  checkRole("hr", "supervisor", "manager", "employee"), // Added hr role and other relevant roles
  evaluationController.getEmployeeEvaluations
);

// Get evaluator evaluations

// POST /api/evaluations/:id/remind - Send reminder for evaluation
router.post(
  "/:id/remind",
  [auth, checkRole("hr", "manager")], // Only HR and managers can send reminders
  evaluationController.sendEvaluationReminder
);

module.exports = router;
