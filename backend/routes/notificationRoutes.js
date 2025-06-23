const express = require("express");
const notificationController = require("../controllers/notificationController");
console.log("Available controller methods:", Object.keys(notificationController));

const { auth, isRH, isSupervisor } = require("../middleware/auth");

// Verify all required controller methods exist
const requiredMethods = [
  'getUserNotifications',
  'createNotification',
  'markAsRead',
  'markAllAsRead',
  'deleteNotification',
  'getAllNotifications',
  'getReminders',
  'getDocumentNotifications',
  'getTrainingNotifications',
  'getCoachingSessionNotifications',
  'getTeamProgress',
  'getOverdueTasks',
  'getFeedbackAvailability',
  'getFeedbackSubmissions',
  'getWeeklyReports',
  'getComplianceAlerts',
  'getLeaveRequests',
  'getTeamFollowups',
  'getProbationDeadlines',
  'getSystemAlerts',
  'getNewEmployees',
  'getNotificationPreferences',
  'updateNotificationPreferences',
  'getNotificationTemplates',
  'createNotificationTemplate',
  'getNotificationTemplate',
  'updateNotificationTemplate',
  'deleteNotificationTemplate'
];

// Check if any required method is missing
const missingMethods = requiredMethods.filter(method => !notificationController[method]);
if (missingMethods.length > 0) {
  throw new Error(`Missing controller methods: ${missingMethods.join(', ')}`);
}

const router = express.Router();

// General notification routes
router.get("/", auth, notificationController.getUserNotifications);
router.post("/", auth, notificationController.createNotification);
router.put("/:id/read", auth, notificationController.markAsRead);
router.put("/read-all", auth, notificationController.markAllAsRead);
router.delete("/:id", auth, notificationController.deleteNotification);

// Filtered notification routes
router.get("/all", auth, isRH, notificationController.getAllNotifications);
router.get("/reminders", auth, notificationController.getReminders);
router.get("/documents", auth, notificationController.getDocumentNotifications);
router.get("/training", auth, notificationController.getTrainingNotifications);
router.get("/coaching-sessions", auth, notificationController.getCoachingSessionNotifications);
router.get("/team-progress", auth, isSupervisor, notificationController.getTeamProgress);
router.get("/overdue-tasks", auth, notificationController.getOverdueTasks);
router.get("/feedback-availability", auth, notificationController.getFeedbackAvailability);
router.get("/feedback-submissions", auth, notificationController.getFeedbackSubmissions);
router.get("/compliance-alerts", auth, notificationController.getComplianceAlerts);

// Role-specific notification routes
router.get("/team-followups", auth, notificationController.getTeamFollowups);
router.get("/probation-deadlines", auth, notificationController.getProbationDeadlines);
router.get("/weekly-reports", auth, notificationController.getWeeklyReports);
router.get("/system-alerts", auth, isRH, notificationController.getSystemAlerts);
router.get("/new-employees", auth, isRH, notificationController.getNewEmployees);

// Add both old and new routes for backward compatibility
// Old routes
router.get("/templates", auth, isRH, notificationController.getNotificationTemplates);
router.post("/templates", auth, isRH, notificationController.createNotificationTemplate);
router.get("/templates/:id", auth, isRH, notificationController.getNotificationTemplate);
router.put("/templates/:id", auth, isRH, notificationController.updateNotificationTemplate);
router.delete("/templates/:id", auth, isRH, notificationController.deleteNotificationTemplate);

// New routes
router.get("/notificationtemplates", auth, isRH, notificationController.getNotificationTemplates);
router.post("/notificationtemplates", auth, isRH, notificationController.createNotificationTemplate);
router.get("/notificationtemplates/:id", auth, isRH, notificationController.getNotificationTemplate);
router.put("/notificationtemplates/:id", auth, isRH, notificationController.updateNotificationTemplate);
router.delete("/notificationtemplates/:id", auth, isRH, notificationController.deleteNotificationTemplate);

// Old preference routes
router.get("/preferences", auth, notificationController.getNotificationPreferences);
router.put("/preferences", auth, notificationController.updateNotificationPreferences);

// New preference routes
router.get("/notification_preferences", auth, notificationController.getNotificationPreferences);
router.put("/notification_preferences", auth, notificationController.updateNotificationPreferences);

module.exports = router;
