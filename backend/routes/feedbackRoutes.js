const express = require("express");
const { check } = require("express-validator");
const feedbackController = require("../controllers/feedbackController");
const { auth, checkRole, isRH } = require("../middleware/auth");

const router = express.Router();

// --- Team/Supervisor Specific Routes ---

// GET /api/feedback/team/summary
router.get(
  "/team/summary",
  auth,
  checkRole("supervisor"),
  feedbackController.getTeamFeedbackSummary
);

// PUT /api/feedback/:feedbackId/acknowledge
router.put(
  "/:feedbackId/acknowledge",
  auth,
  checkRole("supervisor"),
  feedbackController.acknowledgeFeedback
);

// GET /api/feedback/team/alerts
router.get(
  "/team/alerts",
  auth,
  checkRole("supervisor"),
  feedbackController.getTeamFeedbackAlerts
);

// --- Manager & HR Specific Routes ---

// GET /api/feedback/performance-link/:employeeId
router.get(
    "/performance-link/:employeeId",
    auth,
    checkRole("manager", "hr"),
    feedbackController.getFeedbackPerformanceLink
);

// POST /api/feedback/review/:feedbackId
router.post(
    "/review/:feedbackId",
    [
        auth,
        checkRole("manager", "hr"),
        check("status", "A new status is required.").not().isEmpty(),
        check("note", "A review note is required.").not().isEmpty(),
    ],
    feedbackController.reviewFeedback
);

// GET /api/feedback/escalated
router.get(
    "/escalated",
    auth,
    checkRole("manager", "hr"),
    feedbackController.getEscalatedFeedback
);

// GET /api/feedback/patterns
router.get(
    "/patterns",
    auth,
    checkRole("hr"),
    feedbackController.getFeedbackPatterns
);

// POST /api/feedback/:feedbackId/auto-tag
router.post(
    "/:feedbackId/auto-tag",
    auth,
    checkRole("hr"),
    feedbackController.autoTagFeedback
);

// GET /api/feedback/anonymous/summary
router.get(
    "/anonymous/summary",
    auth,
    checkRole("hr"),
    feedbackController.getAnonymousFeedbackSummary
);

// --- General Feedback Routes ---

// GET /api/feedback/all
router.get("/all", auth, checkRole("hr"), feedbackController.getAllFeedback);

// GET /api/feedback/sent
router.get("/sent", auth, feedbackController.getSentFeedback);

// GET /api/feedback/received
router.get("/received", auth, feedbackController.getReceivedFeedback);

// GET /api/feedback/department
router.get(
  "/department",
  auth,
  checkRole("manager"),
  feedbackController.getDepartmentFeedback
);

// GET /api/feedback/export
router.get(
  "/export",
  [
    auth,
    checkRole("hr"),
    check("format")
      .optional()
      .isIn(["csv", "excel", "pdf", "json"])
      .withMessage("Format must be one of: csv, excel, pdf, json"),
    check("dateRange")
      .optional()
      .isIn(["daily", "weekly", "monthly", "yearly"])
      .withMessage("Invalid date range"),
    check("category")
      .optional()
      .isIn(["all", "onboarding", "training", "support", "general"])
      .withMessage("Invalid category")
  ],
  feedbackController.exportFeedback
);

// GET /api/feedback/user/:userId
router.get("/user/:userId", auth, feedbackController.getFeedbackByUserId);

// GET /api/feedback/history (Employee endpoint)
router.get("/history", auth, feedbackController.getFeedbackHistory);

// GET /api/feedback/analytics
router.get(
  "/analytics",
  auth,
  checkRole("manager"),
  feedbackController.getDepartmentFeedbackAnalytics
);

// PUT /api/feedback/:feedbackId/categorize
router.put(
  "/:feedbackId/categorize",
  [
    auth,
    checkRole("hr"),
    check("categories", "Categories must be an array").isArray(),
    check("categories.*", "Each category must be a valid type")
      .isIn(["training", "supervisor", "process"]),
    check("priority", "Priority must be one of: low, medium, high")
      .isIn(["low", "medium", "high"]),
    check("status", "Status must be one of: pending, in-progress, addressed")
      .isIn(["pending", "in-progress", "addressed"])
  ],
  feedbackController.categorizeFeedback
);

// POST /api/feedback/{feedbackId}/notes
router.post(
  "/:feedbackId/notes",
  [
    auth,
    checkRole("supervisor", "hr"),
    check("notes", "Notes are required").not().isEmpty(),
    check("status")
      .optional()
      .isIn(["pending", "in-progress", "completed"])
      .withMessage("Status must be pending, in-progress, or completed"),
    check("followUpDate")
      .optional()
      .isISO8601()
      .withMessage("Follow up date must be a valid date")
  ],
  feedbackController.addFeedbackNotes
);

// POST /api/feedback/{feedbackId}/followup
router.post(
  "/:feedbackId/followup",
  [
    auth,
    checkRole("supervisor", "hr"),
    check("scheduledDate", "Scheduled date is required")
      .not()
      .isEmpty()
      .isISO8601()
      .withMessage("Scheduled date must be a valid date"),
    check("participants", "Participants array is required")
      .isArray()
      .not()
      .isEmpty(),
    check("participants.*", "Each participant must be a valid UUID")
      .isUUID(),
    check("notes", "Notes are required")
      .not()
      .isEmpty()
      .isString()
  ],
  feedbackController.addFeedbackFollowup
);

// POST /api/feedback (Employee endpoint)
router.post(
  "/",
  [
    auth,
    check("content", "Content is required").not().isEmpty(),
    check("type", "Type must be onboarding, training, support, or general")
      .isIn(["onboarding", "training", "support", "general"]),
    check("isAnonymous", "isAnonymous must be a boolean").isBoolean(),
    check("shareWithSupervisor", "shareWithSupervisor must be a boolean").isBoolean()
  ],
  feedbackController.createFeedback
);

// POST /api/feedback/{feedbackId}/response
router.post(
  "/:feedbackId/response",
  [
    auth,
    checkRole("supervisor"),
    check("response", "Response message is required").not().isEmpty(),
    check("status", "Status must be one of: addressed, pending, in-progress")
      .isIn(["addressed", "pending", "in-progress"])
  ],
  feedbackController.respondToFeedback
);

// POST /api/feedback/:feedbackId/escalate
router.post(
  "/:feedbackId/escalate",
  [
    auth,
    checkRole("hr"),
    check("escalateTo", "Escalate to must be either manager or hr")
      .isIn(["manager", "hr"]),
    check("reason", "Reason is required").not().isEmpty(),
    check("notifyParties", "Notify parties must be an array").isArray(),
    check("notifyParties.*", "Each notify party must be either supervisor or hr")
      .isIn(["supervisor", "hr"])
  ],
  feedbackController.escalateFeedback
);

// PUT /api/feedback/:feedbackId/edit
router.put(
  "/:feedbackId/edit",
  [
    auth,
    check("content", "Content is required").not().isEmpty(),
  ],
  feedbackController.editFeedback
);

// DELETE /api/feedback/:id
router.delete("/:id", auth, feedbackController.deleteFeedback);

module.exports = router;