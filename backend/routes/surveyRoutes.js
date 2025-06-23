const express = require("express");
const { check } = require("express-validator");
const surveyController = require("../controllers/surveyController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/surveys
router.get("/", auth, checkRole("hr"), surveyController.getAllSurveys);

// GET /api/surveys/available
router.get("/available", auth, surveyController.getAvailableSurveys);

// GET /api/surveys/user
router.get("/user", auth, surveyController.getUserSurveys);

// GET /api/surveys/history
router.get("/history", auth, surveyController.getSurveyHistory);

// GET /api/surveys/monitoring
router.get(
  "/monitoring",
  auth,
  checkRole("hr", "manager", "supervisor"),
  surveyController.monitorSurveyParticipation
);

// GET /api/surveys/export
router.get(
  "/export",
  auth,
  checkRole("hr", "manager", "supervisor"),
  surveyController.exportSurveyResults
);

// GET /api/surveys/team/results
router.get(
  "/team/results",
  auth,
  checkRole("supervisor", "manager", "hr"),
  surveyController.getTeamSurveyResults
);

// GET /api/surveys/team/completion-status
router.get(
  "/team/completion-status",
  auth,
  checkRole("supervisor", "manager", "hr"),
  surveyController.getTeamSurveyCompletionStatus
);

// GET /api/surveys/department/analytics
router.get(
  "/department/analytics",
  auth,
  checkRole("manager", "hr"),
  surveyController.getDepartmentAnalytics
);

// GET /api/surveys/templates
router.get("/templates", auth, checkRole("hr"), surveyController.getSurveyTemplates);

// GET /api/surveys/templates/:templateId/questions
router.get("/templates/:templateId/questions", auth, checkRole("hr"), surveyController.getSurveyTemplateQuestions);

// POST /api/surveys/templates/:templateId/questions
router.post("/templates/:templateId/questions", auth, checkRole("hr"), surveyController.createSurveyTemplateQuestion);

// DELETE /api/surveys/templates/:templateId/questions/:questionId
router.delete("/templates/:templateId/questions/:questionId", auth, checkRole("hr"), surveyController.deleteSurveyTemplateQuestion);

// PUT /api/surveys/settings
router.put(
  "/settings",
  [
    auth,
    checkRole("hr"),
    check("defaultAnonymous", "defaultAnonymous must be a boolean").optional().isBoolean(),
    check("allowComments", "allowComments must be a boolean").optional().isBoolean(),
    check("requireEvidence", "requireEvidence must be a boolean").optional().isBoolean(),
    check("autoReminders", "autoReminders must be a boolean").optional().isBoolean(),
    check("reminderFrequency", "reminderFrequency must be a number between 1 and 30")
      .optional()
      .isInt({ min: 1, max: 30 }),
    check("responseDeadlineDays", "responseDeadlineDays must be a number between 1 and 90")
      .optional()
      .isInt({ min: 1, max: 90 })
  ],
  surveyController.updateSurveySettings
);

// POST /api/surveys/templates
router.post(
  "/templates",
  [
    auth,
    checkRole("hr"),
    check("title", "Title is required").not().isEmpty(),
    check("description", "Description is required").not().isEmpty(),
    check("type", "Type must be 3-month, 6-month, 12-month, training, or general")
      .isIn(["3-month", "6-month", "12-month", "training", "general"]),
    check("questions", "Questions array is required").isArray(),
    check("questions.*.question", "Question text is required").not().isEmpty(),
    check("questions.*.type", "Question type must be multiple_choice, rating, or text")
      .isIn(["multiple_choice", "rating", "text"]),
    check("questions.*.required", "Required field must be a boolean").isBoolean(),
    check("questions.*.options", "Options must be an array for multiple_choice questions")
      .optional()
      .custom((value, { req }) => {
        if (req.body.type === "multiple_choice" && (!Array.isArray(value) || value.length === 0)) {
          throw new Error("Multiple choice questions must have options array");
        }
        return true;
      }),
  ],
  surveyController.createSurveyTemplate
);

// PUT /api/surveys/templates/:templateId
router.put(
  "/templates/:templateId",
  [
    auth,
    checkRole("hr"),
    check("title", "Title is required").optional(),
    check("description", "Description is required").optional(),
    check("type", "Type must be 3-month, 6-month, 12-month, training, or general")
      .optional()
      .isIn(["3-month", "6-month", "12-month", "training", "general"]),
    check("targetRole", "Target role must be employee, supervisor, manager, hr, or all")
      .optional()
      .isIn(["employee", "supervisor", "manager", "hr", "all"]),
    check("targetProgram")
      .optional()
      .isIn(["inkompass", "earlyTalent", "apprenticeship", "academicPlacement", "workExperience", "all"]),
    check("status", "Status must be draft, active, or completed")
      .optional()
      .isIn(["draft", "active", "completed"]),
    check("questions", "Questions array is required").isArray(),
    check("questions.*.question", "Question text is required").not().isEmpty(),
    check("questions.*.type", "Question type must be multiple_choice, rating, or text")
      .isIn(["multiple_choice", "rating", "text"]),
    check("questions.*.required", "Required field must be a boolean").isBoolean(),
    check("questions.*.questionOrder", "Question order is required").isInt({ min: 1 }),
    check("questions.*.options")
      .optional()
      .custom((value, { req }) => {
        const question = req.body.questions.find(q => q.options === value);
        if (question && question.type === "multiple_choice" && (!Array.isArray(value) || value.length === 0)) {
          throw new Error("Multiple choice questions must have options array");
        }
        if (question && question.type === "rating" && (!Array.isArray(value) || value.length === 0)) {
          throw new Error("Rating questions must have options array");
        }
        return true;
      }),
  ],
  surveyController.updateSurveyTemplate
);

// POST /api/surveys/schedule
router.post(
  "/schedule",
  [
    auth,
    checkRole("hr"),
    check("surveyId", "Survey ID is required").not().isEmpty(),
    check("scheduleType", "Schedule type must be one-time or recurring").isIn(["one-time", "recurring"]),
    check("targetDate", "Target date is required").isISO8601(),
    check("targetDepartments", "Target departments must be an array").optional().isArray(),
    check("targetPrograms", "Target programs must be an array").optional().isArray(),
    check("recurringInterval", "Recurring interval must be weekly, monthly, or quarterly")
      .optional()
      .isIn(["weekly", "monthly", "quarterly"]),
    check("endDate", "End date must be a valid date")
      .optional()
      .isISO8601()
      .custom((value, { req }) => {
        if (req.body.scheduleType === "recurring" && !value) {
          throw new Error("End date is required for recurring schedules");
        }
        if (value && new Date(value) <= new Date(req.body.targetDate)) {
          throw new Error("End date must be after target date");
        }
        return true;
      }),
  ],
  surveyController.scheduleSurvey
);

// GET /api/surveys/schedule
router.get("/schedule", auth, checkRole("hr"), surveyController.getSurveySchedules);

// GET /api/surveys/:id
router.get("/:id", auth, surveyController.getSurveyById);

// POST /api/surveys
router.post(
  "/",
  [
    auth,
    checkRole("hr"),
    check("title", "Title is required").not().isEmpty(),
    check(
      "type",
      "Type must be 3-month, 6-month, 12-month, training, or general"
    ).isIn(["3-month", "6-month", "12-month", "training", "general"]),
    check(
      "targetRole",
      "Target role must be employee, supervisor, manager, hr, or all"
    ).isIn(["employee", "supervisor", "manager", "hr", "all"]),
  ],
  surveyController.createSurvey
);

// PUT /api/surveys/:id
router.put(
  "/:id",
  [
    auth,
    checkRole("hr"),
    check("title", "Title is required").optional(),
    check("status", "Status must be draft, active, or completed")
      .optional()
      .isIn(["draft", "active", "completed"]),
  ],
  surveyController.updateSurvey
);

// DELETE /api/surveys/:id
router.delete("/:id", auth, checkRole("hr"), surveyController.deleteSurvey);

// POST /api/surveys/:id/questions
router.post(
  "/:id/questions",
  [
    auth,
    checkRole("hr"),
    check("text", "Question text is required").not().isEmpty(),
    check("type", "Type must be multiple_choice, rating, or text").isIn([
      "multiple_choice",
      "rating",
      "text",
    ]),
  ],
  surveyController.addQuestion
);

// PUT /api/surveys/questions/:id
router.put(
  "/questions/:id",
  [
    auth,
    checkRole("hr"),
    check("text", "Question text is required").optional(),
    check("type", "Type must be multiple_choice, rating, or text")
      .optional()
      .isIn(["multiple_choice", "rating", "text"]),
  ],
  surveyController.updateQuestion
);

// DELETE /api/surveys/questions/:id
router.delete(
  "/questions/:id",
  auth,
  checkRole("hr"),
  surveyController.deleteQuestion
);

// POST /api/surveys/:surveyId/respond
router.post(
  "/:surveyId/respond",
  [
    auth,
    check("responses", "Responses are required").isArray(),
    check("responses.*.questionId", "Question ID is required for each response").not().isEmpty(),
    check("responses.*.answer", "Answer is required for each response").optional(),
    check("responses.*.rating", "Rating must be between 1 and 5").optional().isInt({ min: 1, max: 5 }),
    check("responses.*.selectedOption", "Selected option must be a string").optional().isString(),
  ],
  surveyController.submitResponse
);

// GET /api/surveys/:id/responses
router.get(
  "/:id/responses",
  auth,
  checkRole("hr"),
  surveyController.getSurveyResponses
);

module.exports = router;
