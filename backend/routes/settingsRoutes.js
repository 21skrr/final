const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const userController = require("../controllers/userController");
const systemSettingsController = require('../controllers/systemSettingsController');

const router = express.Router();

// HR: Update notification settings
// PUT /api/settings/notifications/onboarding
router.put(
  "/notifications/onboarding",
  [
    auth,
    roleCheck(["hr", "admin"]),
    check("settings", "Settings object is required").isObject(),
  ],
  onboardingController.updateNotificationSettings
);

// GET /api/settings/notifications
router.get(
  "/notifications",
  auth,
  onboardingController.getNotificationSettings
);

// PUT /api/settings/notifications
router.put(
  "/notifications",
  auth,
  onboardingController.updateUserNotificationSettings
);

// --- System Settings ---

// GET /api/settings/system - Get all system-level settings
router.get(
  "/system",
  auth,
  roleCheck(["hr"]),
  systemSettingsController.getSettings
);

// PUT /api/settings/system - Update system-level settings
router.put(
  "/system",
  auth,
  roleCheck(["hr"]),
  systemSettingsController.updateSettings
);

// --- User Settings ---

// GET /api/settings/:userId - Get settings for a specific user
router.get(
  "/:userId",
  auth,
  userController.getUserSettings
);

// PUT /api/settings/:userId - Update settings for a specific user
router.put(
  "/:userId",
  auth,
  userController.updateUserSettings
);

module.exports = router;
