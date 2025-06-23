// backend/routes/onboardingTemplateRoutes.js
const express = require("express");
const { check } = require("express-validator");
const onboardingTemplateController = require("../controllers/onboardingTemplateController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const templateValidation = [
  check("name", "Template name is required").not().isEmpty(),
  check("description", "Description is required").not().isEmpty(),
  check("programType", "Program type is required").isIn([
    "inkompass",
    "earlyTalent",
    "apprenticeship",
    "academicPlacement",
    "workExperience",
    "all",
  ]),
  check("stages", "Stages must be an array").isArray(),
  check("stages.*.name", "Stage name is required").not().isEmpty(),
  check("stages.*.description", "Stage description is required")
    .not()
    .isEmpty(),
  check("stages.*.duration", "Stage duration is required").isInt({ min: 1 }),
  check("stages.*.tasks", "Tasks must be an array").isArray(),
  check("stages.*.tasks.*.title", "Task title is required").not().isEmpty(),
  check("stages.*.tasks.*.description", "Task description is required")
    .not()
    .isEmpty(),
  check("stages.*.tasks.*.dueDate", "Task due date is required").isISO8601(),
  check("stages.*.tasks.*.priority", "Task priority is required").isIn([
    "low",
    "medium",
    "high",
  ]),
];

// GET /api/onboarding-templates
router.get("/", auth, onboardingTemplateController.getAllTemplates);

// GET /api/onboarding-templates/:id
router.get("/:id", auth, onboardingTemplateController.getTemplateById);

// POST /api/onboarding-templates
router.post(
  "/",
  [auth, checkRole("hr"), templateValidation],
  onboardingTemplateController.createTemplate
);

// PUT /api/onboarding-templates/:id
router.put(
  "/:id",
  [auth, checkRole("hr"), templateValidation],
  onboardingTemplateController.updateTemplate
);

// DELETE /api/onboarding-templates/:id
router.delete(
  "/:id",
  [auth, checkRole("hr")],
  onboardingTemplateController.deleteTemplate
);

// POST /api/onboarding-templates/apply
router.post(
  "/apply",
  [
    auth,
    checkRole("hr"),
    check("templateId", "Template ID is required").not().isEmpty(),
    check("userId", "User ID is required").not().isEmpty(),
  ],
  onboardingTemplateController.applyTemplateToUser
);

module.exports = router;
