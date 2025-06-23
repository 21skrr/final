const express = require("express");
const { check } = require("express-validator");
const evaluationController = require("../controllers/evaluationController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// PUT /api/evaluationcriteria/:id - Update a specific evaluation criterion by ID
router.put(
  "/:id", // This path will be /:id when the router is mounted at /api/evaluationcriteria
  [
    auth,
    checkRole("supervisor", "hr", "manager"), // Assuming these roles can update criteria
    check("category", "Category is required").not().isEmpty(), // Add validation for fields that can be updated
    check("criteria", "Criteria name is required").not().isEmpty(),
    check("rating", "Rating is required and must be a number").isNumeric(), // Or isInt with min/max if rating is on a scale
    check("comments", "Comments are required").not().isEmpty() // Adjust validation based on which fields are updateable
  ],
  evaluationController.updateEvaluationCriteria // Map to the controller function
);

// Add other evaluation criteria routes here (e.g., GET, DELETE for a single criterion if needed)

// DELETE /api/evaluationcriteria/:id - Remove a specific criterion by ID
router.delete(
  "/:id",
  [
    auth,
    checkRole("hr", "supervisor", "manager"), // Assuming HR, supervisors, and managers can delete criteria
  ],
  evaluationController.deleteEvaluationCriterion
);

module.exports = router; 