const {
  OnboardingProgress,
  User,
  Task,
  ChecklistAssignment,
  Checklist,
  ChecklistItem,
  ChecklistProgress,
  NotificationSettings,
  OnboardingTask,
  UserTaskProgress,
} = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Parser } = require("json2csv");
const { v4: uuidv4 } = require("uuid");
const { getSystemSetting } = require("../utils/systemSettingsService");

// Employee: Get my onboarding progress (Read-only)
// GET /api/onboarding/progress/me
const getMyProgress = async (req, res) => {
  try {
    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.user.id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // For employees, return read-only data without task editing capabilities
    const response = {
      ...progress.toJSON(),
      canEdit: false,
      canAdvance: false,
      canValidate: false
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Supervisor/HR: Get onboarding progress for a specific employee
// GET /api/onboarding/progress/:userId
const getUserProgress = async (req, res) => {
  try {
    const requestingUser = req.user;
    const targetUserId = req.params.userId;

    // Allow employees to access their own progress
    if (requestingUser.id === targetUserId) {
      // proceed as normal
    } else if (requestingUser.role === 'hr') {
      // HR is allowed.
    } else if (requestingUser.role === 'supervisor') {
      const user = await User.findByPk(targetUserId);
      if (!user || user.supervisorId !== requestingUser.id) {
        return res.status(403).json({ message: "Supervisors can only view progress for their direct reports." });
      }
    } else if (requestingUser.role === 'manager') {
      // Managers have read-only access
      const user = await User.findByPk(targetUserId);
      if (!user || user.department !== requestingUser.department) {
        return res.status(403).json({ message: "Managers can only view progress for their department." });
      }
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Add permission flags based on user role
    const response = {
      ...progress.toJSON(),
      canEdit: requestingUser.role === 'hr' || (requestingUser.role === 'supervisor' && requestingUser.id !== targetUserId),
      canAdvance: requestingUser.role === 'hr' || (requestingUser.role === 'supervisor' && requestingUser.id !== targetUserId),
      canValidate: requestingUser.role === 'hr'
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Get all onboarding progresses
// GET /api/onboarding/progress
const getAllProgresses = async (req, res) => {
  try {
    // Verify the user has permission - Only HR can view all.
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const progresses = await OnboardingProgress.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    res.json(progresses);
  } catch (error) {
    console.error("Error fetching all onboarding progresses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Employee: Update my onboarding progress (Read-only for employees)
// PUT /api/onboarding/journey
const updateMyProgress = async (req, res) => {
  try {
    // Employees cannot update their own progress
    return res.status(403).json({ message: "Employees cannot update their own onboarding progress" });
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Supervisor/HR: Update onboarding progress for an employee
// PUT /api/onboarding/progress/:userId
const updateUserProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "supervisor") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // For supervisors, check if they're updating their direct report
    if (req.user.role === "supervisor") {
      const targetUser = await User.findByPk(req.params.userId);
      if (!targetUser || targetUser.supervisorId !== req.user.id) {
        return res.status(403).json({ message: "Supervisors can only update their direct reports' progress" });
      }
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    const { stage, progress: progressValue } = req.body;

    if (stage !== undefined) {
      await progress.update({ stage });
    }

    if (progressValue !== undefined) {
      await progress.update({ progress: progressValue });
    }

    const updatedProgress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's onboarding journey
const getUserJourney = async (req, res) => {
  try {
    // Check if we're getting a specific user's journey or the current user's
    const userId = req.params.userId || req.user.id;
    const requestingUser = req.user;

    // Check permissions
    if (userId === requestingUser.id) {
      // User is requesting their own journey, which is allowed.
    } else if (requestingUser.role === 'hr') {
      // HR can view any journey.
    } else if (requestingUser.role === 'supervisor') {
      const user = await User.findByPk(userId);
      if (!user || user.supervisorId !== requestingUser.id) {
        return res.status(403).json({ message: "Supervisors can only view their team members' journeys." });
      }
    } else {
      // Deny access if none of the above conditions are met.
      return res.status(403).json({ message: "Not authorized to view this journey" });
    }

    // Get onboarding progress
    const progress = await OnboardingProgress.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Get assigned checklists
    const assignments = await ChecklistAssignment.findAll({
      where: { userId },
      include: [
        {
          model: Checklist,
          include: [
            {
              model: ChecklistItem,
              include: [
                {
                  model: ChecklistProgress,
                  where: { userId },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    // Group tasks by onboarding phase
    const phases = {
      prepare: {
        label: "PREPARE",
        description: "Pre-boarding and preparation",
        items: [],
        progress: 0,
      },
      orient: {
        label: "ORIENT",
        description: "Orientation and initial training",
        items: [],
        progress: 0,
      },
      land: {
        label: "LAND",
        description: "Integration into the role",
        items: [],
        progress: 0,
      },
      integrate: {
        label: "INTEGRATE",
        description: "Team integration and process familiarity",
        items: [],
        progress: 0,
      },
      excel: {
        label: "EXCEL",
        description: "Advanced training and development",
        items: [],
        progress: 0,
      },
    };

    // Organize items by phase
    assignments.forEach((assignment) => {
      if (assignment.Checklist && assignment.Checklist.ChecklistItems) {
        assignment.Checklist.ChecklistItems.forEach((item) => {
          if (phases[item.phase]) {
            const progress =
              item.ChecklistProgresses && item.ChecklistProgresses.length > 0
                ? item.ChecklistProgresses[0]
                : null;

            phases[item.phase].items.push({
              id: item.id,
              title: item.title,
              description: item.description,
              dueDate: item.dueDate,
              isCompleted: progress ? progress.isCompleted : false,
              completedAt: progress ? progress.completedAt : null,
              verificationStatus: progress
                ? progress.verificationStatus
                : "pending",
              verifiedAt: progress ? progress.verifiedAt : null,
              progressId: progress ? progress.id : null,
            });
          }
        });
      }
    });

    // Calculate progress for each phase
    Object.keys(phases).forEach((phase) => {
      const items = phases[phase].items;
      const totalItems = items.length;
      const completedItems = items.filter(
        (item) => item.isCompleted && item.verificationStatus === "approved"
      ).length;

      phases[phase].progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    });

    // Create response object
    const result = {
      userId,
      currentStage: progress.stage,
      stageStartDate: progress.stageStartDate,
      estimatedCompletionDate: progress.estimatedCompletionDate,
      user: progress.User,
      overallProgress: progress.progress,
      phases,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching onboarding journey:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetches onboarding progress based on the user's role and permissions.
 * - HR can see all progresses.
 * - Supervisors can see their direct subordinates' progresses.
 * - Employees can only see their own progress.
 */
const getOnboardingProgress = async (req, res) => {
  try {
    const requestingUser = req.user;
    const { userId } = req.params; // For specific user queries

    let whereClause = {};

    if (requestingUser.role === 'hr') {
      // HR can see all, or a specific user if userId is provided
      if (userId) {
        whereClause.UserId = userId;
      }
    } else if (requestingUser.role === 'supervisor') {
      // Supervisor can see their subordinates or themselves
      const subordinateIds = (await User.findAll({
        where: { supervisorId: requestingUser.id },
        attributes: ['id'],
      })).map(u => u.id);

      // Allow supervisor to also query their own progress
      subordinateIds.push(requestingUser.id); 

      if (userId) {
        // If a specific user is requested, they must be a subordinate
        if (!subordinateIds.includes(userId)) {
          return res.status(403).json({ message: "You are not authorized to view this user's progress." });
        }
        whereClause.UserId = userId;
      } else {
        // Otherwise, return all subordinates
        whereClause.UserId = { [Op.in]: subordinateIds };
      }
    } else {
      // Employee can only see their own progress
      whereClause.UserId = requestingUser.id;
    }

    const includeOptions = [
      {
        model: User,
        attributes: ["id", "name", "email", "role", "department", "startDate"],
      },
      // Add other relevant includes like OnboardingTask, etc.
    ];

    const progressData = await OnboardingProgress.findAll({
      where: whereClause,
      include: includeOptions,
    });
    
    if (!progressData || progressData.length === 0) {
      return res.status(404).json({ message: "No onboarding progress found." });
    }

    // If a specific user was requested, return a single object, otherwise return an array
    if (userId || (requestingUser.role !== 'hr' && requestingUser.role !== 'supervisor')) {
        res.json(progressData[0]);
    } else {
        res.json(progressData);
    }

  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update onboarding progress
const updateOnboardingProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const progress = await OnboardingProgress.findOne({
      where: { userId: req.params.id },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    const { stage, progress: progressValue } = req.body;

    // Update progress
    const updateData = {};
    if (stage) {
      updateData.stage = stage;
      updateData.stageStartDate = new Date();
      updateData.estimatedCompletionDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days from now
    }
    if (progressValue !== undefined) {
      updateData.progress = progressValue;
    }

    await progress.update(updateData);

    // Get updated progress
    const updatedProgress = await OnboardingProgress.findOne({
      where: { userId: req.params.id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export onboarding progress as CSV
const exportOnboardingCSV = async (req, res) => {
  try {
    const progresses = await OnboardingProgress.findAll();
    const fields = ["userId", "stage", "progress", "createdAt", "updatedAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(progresses.map((p) => p.toJSON()));
    res.header("Content-Type", "text/csv");
    res.attachment("onboarding_report.csv");
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to export onboarding progress" });
  }
};

// HR: Assign checklists to an employee
// POST /api/onboarding/checklists/assign
// HR: Assign checklists to an employee
// POST /api/onboarding/checklists/assign
const assignChecklists = async (req, res) => {
  try {
    const { userId, checklistIds } = req.body;

    if (!userId || !Array.isArray(checklistIds)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const checklists = await Checklist.findAll({
      where: { id: { [Op.in]: checklistIds } },
    });

    if (checklists.length !== checklistIds.length) {
      return res.status(400).json({ message: "One or more checklists not found" });
    }

    // ✅ Get onboarding rules dynamically inside the function
    const onboardingRules = await getSystemSetting("onboardingRules");
    const deadlineDays = onboardingRules?.deadlineDays || 14;

    const assignments = [];
    for (const checklistId of checklistIds) {
      const [assignment] = await ChecklistAssignment.findOrCreate({
        where: { userId, checklistId },
        defaults: {
          id: uuidv4(),
          assignedBy: req.user.id,
          dueDate: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
          status: "assigned",
          completionPercentage: 0,
          isAutoAssigned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      assignments.push(assignment);
    }

    res.status(201).json({
      message: "Checklists assigned successfully",
      assignments,
    });
  } catch (error) {
    console.error("Error assigning checklists:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// HR: Reset employee's journey
// POST /api/onboarding/journey/:userId/reset
const resetJourney = async (req, res) => {
  try {
    const { userId } = req.params;
    const { resetToStage = "prepare", keepCompletedTasks = false } = req.body;

    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find the user's onboarding progress
    const progress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Reset onboarding progress
    await progress.update({
      stage: resetToStage,
      progress: 0,
      stageStartDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // If not keeping completed tasks, reset task progress
    if (!keepCompletedTasks) {
      await UserTaskProgress.destroy({
        where: { UserId: userId },
      });
    }

    res.json({
      message: "Onboarding journey reset successfully",
      progress,
    });
  } catch (error) {
    console.error("Error resetting journey:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Get onboarding reports
// GET /api/reports/onboarding
const getOnboardingReports = async (req, res) => {
  try {
    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { department, role, startDateFrom, startDateTo } = req.query;

    // Build query filters
    const whereUser = {};
    if (department) whereUser.department = department;
    if (role) whereUser.role = role;

    if (startDateFrom || startDateTo) {
      whereUser.startDate = {};
      if (startDateFrom) whereUser.startDate[Op.gte] = new Date(startDateFrom);
      if (startDateTo) whereUser.startDate[Op.lte] = new Date(startDateTo);
    }

    // Get all onboarding progresses with user info
    const progresses = await OnboardingProgress.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
          where: Object.keys(whereUser).length > 0 ? whereUser : undefined,
        },
      ],
    });

    // Generate summary statistics
    const summary = {
      total: progresses.length,
      byStage: {
        prepare: progresses.filter((p) => p.stage === "prepare").length,
        orient: progresses.filter((p) => p.stage === "orient").length,
        land: progresses.filter((p) => p.stage === "land").length,
        integrate: progresses.filter((p) => p.stage === "integrate").length,
        excel: progresses.filter((p) => p.stage === "excel").length,
      },
      byProgress: {
        notStarted: progresses.filter((p) => p.progress === 0).length,
        inProgress: progresses.filter((p) => p.progress > 0 && p.progress < 100)
          .length,
        completed: progresses.filter((p) => p.progress === 100).length,
      },
      byDepartment: {},
      byRole: {},
    };

    // Group by department and role
    progresses.forEach((progress) => {
      if (progress.User) {
        // By department
        const dept = progress.User.department || "Unassigned";
        if (!summary.byDepartment[dept]) summary.byDepartment[dept] = 0;
        summary.byDepartment[dept]++;

        // By role
        const role = progress.User.role || "Unassigned";
        if (!summary.byRole[role]) summary.byRole[role] = 0;
        summary.byRole[role]++;
      }
    });

    res.json({
      summary,
      progresses,
    });
  } catch (error) {
    console.error("Error generating onboarding reports:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Update notification settings
// PUT /api/settings/notifications/onboarding
const updateNotificationSettings = async (req, res) => {
  try {
    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings data" });
    }

    // Get or create notification settings
    let [notificationSettings, created] =
      await NotificationSettings.findOrCreate({
        where: { userId: req.user.id, category: "onboarding" },
        defaults: {
          settings: settings,
        },
      });

    if (!created) {
      // Update existing settings
      await notificationSettings.update({
        settings: settings,
      });
    }

    res.json({
      message: "Notification settings updated successfully",
      settings: notificationSettings,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/settings/notifications
const getNotificationSettings = async (req, res) => {
  try {
    const NotificationSettings = require('../models/NotificationSettings');
    let notificationSettings = await NotificationSettings.findOne({
      where: { userId: req.user.id, category: 'onboarding' }
    });
    if (!notificationSettings) {
      // Return default settings if not set
      notificationSettings = {
        settings: {
          taskCompletionHR: true,
          taskCompletionEmployee: true,
          stageTransition: true,
          delayAlerts: true,
          newAssignments: true
        }
      };
    }
    res.json(notificationSettings.settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/settings/notifications
const updateUserNotificationSettings = async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings data" });
    }
    let [notificationSettings, created] = await NotificationSettings.findOrCreate({
      where: { userId: req.user.id, category: "general" },
      defaults: { settings }
    });
    if (!created) {
      await notificationSettings.update({ settings });
    }
    res.json({
      message: "Notification settings updated successfully",
      settings: notificationSettings.settings
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Delete onboarding progress for an employee (optional)
// DELETE /api/onboarding/journey/:userId
const deleteUserProgress = async (req, res) => {
  try {
    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Delete the progress
    await progress.destroy();

    res.json({ message: "Onboarding progress deleted successfully" });
  } catch (error) {
    console.error("Error deleting onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Add the createJourney function here, BEFORE module.exports
const createJourney = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if journey already exists
    const existingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId }
    });

    if (existingProgress) {
      return res.status(400).json({ message: 'Onboarding journey already exists for this user' });
    }

    // Create new onboarding progress
    const newProgress = await OnboardingProgress.create({
      UserId: userId,
      stage: 'prepare',
      progress: 0,
      stageStartDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    });

    // Assign all default onboarding tasks to the user
    const OnboardingTask = require('../models/OnboardingTask');
    const UserTaskProgress = require('../models/UserTaskProgress')(require('../config/database'));
    const defaultTasks = await OnboardingTask.findAll({ where: { isDefault: true } });
    const userTaskProgresses = defaultTasks.map(task => ({
      UserId: userId,
      OnboardingTaskId: task.id,
      isCompleted: false
    }));
    if (userTaskProgresses.length > 0) {
      await UserTaskProgress.bulkCreate(userTaskProgresses);
    }

    // Include user data in response
    const progressWithUser = await OnboardingProgress.findByPk(newProgress.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'role', 'department']
      }]
    });

    res.status(201).json({
      message: 'Onboarding journey created successfully',
      data: progressWithUser
    });

  } catch (error) {
    console.error('Error creating onboarding journey:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Calculate progress for a specific phase and user
const calculatePhaseProgress = async (userId, phase) => {
  // Get all tasks for this phase
  const tasks = await OnboardingTask.findAll({
    where: { stage: phase }
  });
  if (tasks.length === 0) return 0;

  // Get user-specific progress for these tasks
  const userTaskProgresses = await UserTaskProgress.findAll({
    where: {
      UserId: userId,
      OnboardingTaskId: tasks.map(t => t.id)
    }
  });

  // Count completed and validated tasks for this user in this phase
  const completedAndValidated = userTaskProgresses.filter(
    utp => utp.isCompleted && utp.hrValidated
  ).length;

  return Math.round((completedAndValidated / tasks.length) * 100);
};

// Get user's onboarding progress
const getUserOnboardingProgress = async (req, res) => {
  const { userId } = req.params;
  try {
    const phases = ['prepare', 'orient', 'land', 'integrate', 'excel'];
    const progress = {};
    const tasksByPhase = {};

    // Get user's onboarding progress record
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId }
    });
    if (!onboardingProgress) {
      return res.status(404).json({ error: 'Onboarding progress not found for user' });
    }

    // For each phase, get all tasks and merge with user-specific progress
    for (const phase of phases) {
      const tasks = await OnboardingTask.findAll({
        where: { stage: phase },
        order: [['order', 'ASC']],
      });

      // Ensure every task has a UserTaskProgress for this user
      for (const task of tasks) {
        const userTask = await UserTaskProgress.findOne({
          where: { UserId: userId, OnboardingTaskId: task.id }
        });
        if (!userTask) {
          await UserTaskProgress.create({
            UserId: userId,
            OnboardingTaskId: task.id,
            isCompleted: false,
            hrValidated: false
          });
        }
      }

      // Now fetch with user progress as before
      const tasksWithUserProgress = await Promise.all(tasks.map(async (task) => {
        const userTask = await UserTaskProgress.findOne({
          where: { UserId: userId, OnboardingTaskId: task.id }
        });
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          stage: task.stage,
          order: task.order,
          controlledBy: task.controlledBy,
          isDefault: task.isDefault,
          isCompleted: userTask ? userTask.isCompleted : false,
          completedAt: userTask ? userTask.completedAt : null,
          hrValidated: userTask ? userTask.hrValidated : false,
          notes: userTask ? userTask.notes : null,
        };
      }));
      tasksByPhase[phase] = tasksWithUserProgress;
      progress[phase] = await calculatePhaseProgress(userId, phase);
    }

    // Calculate overall progress (percentage of completed+validated tasks for this user)
    const allUserTasks = await UserTaskProgress.findAll({ where: { UserId: userId } });
    const completedAndValidated = allUserTasks.filter(task => task.isCompleted && task.hrValidated).length;
    progress.overall = allUserTasks.length === 0 ? 0 : Math.round((completedAndValidated / allUserTasks.length) * 100);

    // Update progress in onboardingprogresses table
    await onboardingProgress.update({
      progress: progress.overall,
      status: progress.overall === 100 ? 'completed' : 'in_progress'
    });

    res.json({
      progress,
      tasksByPhase,
      currentStage: onboardingProgress.stage,
      status: onboardingProgress.status,
      stageStartDate: onboardingProgress.stageStartDate,
      estimatedCompletionDate: onboardingProgress.estimatedCompletionDate
    });
  } catch (error) {
    console.error('Error getting user onboarding progress:', error);
    res.status(500).json({ error: 'Failed to get onboarding progress' });
  }
};

// Update task completion and validation status (Supervisor/HR only)
const updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { completed, hrValidated } = req.body;
  
  try {
    // Check if user can edit tasks
    if (!['hr', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Task editing not allowed for this role' });
    }

    const task = await OnboardingTask.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // For supervisors, check if they're editing their direct report's task
    if (req.user.role === 'supervisor') {
      const userTaskProgress = await UserTaskProgress.findOne({
        where: { OnboardingTaskId: taskId }
      });
      
      if (userTaskProgress) {
        const targetUser = await User.findByPk(userTaskProgress.UserId);
        if (!targetUser || targetUser.supervisorId !== req.user.id) {
          return res.status(403).json({ error: 'Supervisors can only edit their direct reports\' tasks' });
        }
      }
    }
    
    await task.update({
      completed: completed !== undefined ? completed : task.completed,
      hrValidated: hrValidated !== undefined ? hrValidated : task.hrValidated
    });
    
    // Get updated phase progress
    const phaseProgress = await calculatePhaseProgress(req.user.id, task.stage);
    
    res.json({
      message: 'Task status updated successfully',
      task,
      phaseProgress
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

// Get all default onboarding tasks grouped by stage (HR only)
const getDefaultTasks = async (req, res) => {
  try {
    // Allow employees and HR to access default tasks
    if (!['hr', 'employee'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only HR and employees can access default tasks' });
    }

    const tasks = await OnboardingTask.findAll({
      where: { isDefault: 1 },
      order: [['stage', 'ASC'], ['order', 'ASC']]
    });
    // Group by stage
    const grouped = {};
    tasks.forEach(task => {
      if (!grouped[task.stage]) grouped[task.stage] = [];
      grouped[task.stage].push(task);
    });
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching default onboarding tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Advance to next onboarding phase (Supervisor/HR only)
const advanceToNextPhase = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can advance phases
    if (!['hr', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Phase advancement not allowed for this role' });
    }

    // For supervisors, check if they're advancing their direct report's phase
    if (req.user.role === 'supervisor') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser || targetUser.supervisorId !== req.user.id) {
        return res.status(403).json({ message: 'Supervisors can only advance their direct reports\' phases' });
      }
    }

    const progress = await OnboardingProgress.findOne({ where: { UserId: userId } });
    if (!progress) {
      return res.status(404).json({ message: 'Onboarding progress not found' });
    }
    const stages = ['prepare', 'orient', 'land', 'integrate', 'excel'];
    const currentIndex = stages.indexOf(progress.stage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return res.status(400).json({ message: 'Cannot advance: already at last stage or invalid stage' });
    }
    const nextStage = stages[currentIndex + 1];
    await progress.update({
      stage: nextStage,
      stageStartDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const updated = await OnboardingProgress.findOne({
      where: { UserId: userId },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role', 'department'] }],
    });
    res.json(updated);
  } catch (error) {
    console.error('Error advancing onboarding phase:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get detailed progress for all phases (Employee only - read-only)
const getDetailedProgress = async (req, res) => {
  try {
    // Only employees can access their own detailed progress
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can access their own detailed progress' });
    }

    const phases = ['prepare', 'orient', 'land', 'integrate', 'excel'];
    const progress = {};
    const tasksByPhase = {};
    
    // Calculate progress for each phase and get tasks
    for (const phase of phases) {
      progress[phase] = await calculatePhaseProgress(req.user.id, phase);
      tasksByPhase[phase] = await OnboardingTask.findAll({
        where: { stage: phase },
        order: [['order', 'ASC']],
        attributes: ['id', 'title', 'stage', 'completed', 'hrValidated', 'order']
      });
    }
    
    // Calculate overall progress
    const totalTasks = await OnboardingTask.count();
    const totalValidated = await OnboardingTask.count({
      where: { completed: true, hrValidated: true }
    });
    
    progress.overall = totalTasks === 0 ? 0 : Math.round((totalValidated / totalTasks) * 100);
    
    res.json({
      progress,
      tasksByPhase,
      totalTasks,
      totalValidated,
      canEdit: false // Employees cannot edit tasks
    });
  } catch (error) {
    console.error('Error calculating progress:', error);
    res.status(500).json({ error: 'Failed to calculate progress' });
  }
};

// HR validates a task (HR only)
const validateTask = async (req, res) => {
  const { taskId } = req.params;
  const { userId, comments } = req.body;
  
  try {
    // Only HR can validate tasks
    if (req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Only HR can validate tasks' });
    }

    // Find the task
    const task = await OnboardingTask.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update the task's hrValidated status
    await task.update({ hrValidated: true });
    
    // If userId is provided, update the specific user's task progress
    if (userId) {
      const userTaskProgress = await UserTaskProgress.findOne({
        where: { 
          UserId: userId,
          OnboardingTaskId: taskId 
        }
      });
      
      if (userTaskProgress) {
        await userTaskProgress.update({
          hrValidated: true,
          hrValidatedAt: new Date(),
          hrComments: comments || null
        });
      }
    }
    
    // Get updated phase progress
    const phaseProgress = await calculatePhaseProgress(userId || req.user.id, task.stage);
    
    res.json({
      message: 'Task validated successfully',
      task,
      phaseProgress
    });
  } catch (error) {
    console.error('Error validating task:', error);
    res.status(500).json({ error: 'Failed to validate task' });
  }
};

// Update task completion status (Supervisor/HR only)
const updateTaskCompletion = async (req, res) => {
  const { taskId } = req.params;
  const { completed } = req.body;
  
  try {
    // Check if user can edit tasks
    if (!['hr', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Task editing not allowed for this role' });
    }

    const task = await OnboardingTask.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // For supervisors, check if they're editing their direct report's task
    if (req.user.role === 'supervisor') {
      const userTaskProgress = await UserTaskProgress.findOne({
        where: { OnboardingTaskId: taskId }
      });
      
      if (userTaskProgress) {
        const targetUser = await User.findByPk(userTaskProgress.UserId);
        if (!targetUser || targetUser.supervisorId !== req.user.id) {
          return res.status(403).json({ error: 'Supervisors can only edit their direct reports\' tasks' });
        }
      }
    }
    
    await task.update({ completed });
    
    res.json({
      message: 'Task completion status updated',
      task
    });
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ error: 'Failed to update task completion' });
  }
};

// Get tasks by phase (Employee only - read-only)
const getTasksByPhase = async (req, res) => {
  try {
    // Only employees can access phase-specific tasks
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can access phase-specific tasks' });
    }

    const { phase } = req.params;
    const tasks = await OnboardingTask.findAll({
      where: { stage: phase },
      attributes: ['id', 'title', 'description', 'stage', 'completed', 'hrValidated', 'order'],
      order: [['order', 'ASC']]
    });

    const progress = await calculatePhaseProgress(req.user.id, phase);

    res.json({
      phase,
      tasks,
      progress,
      canEdit: false // Employees cannot edit tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by phase:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Then keep the module.exports with createJourney included
module.exports = {
  getMyProgress,
  getUserProgress,
  getAllProgresses,
  updateMyProgress,
  updateUserProgress,
  getUserJourney,
  getOnboardingProgress,
  updateOnboardingProgress,
  exportOnboardingCSV,
  assignChecklists,
  resetJourney,
  getOnboardingReports,
  updateNotificationSettings,
  getNotificationSettings,
  updateUserNotificationSettings,
  deleteUserProgress,
  createJourney,
  getUserOnboardingProgress,
  updateTaskStatus,
  getDefaultTasks,
  advanceToNextPhase,
  getDetailedProgress,
  validateTask,
  updateTaskCompletion,
  getTasksByPhase
};

// Remove the createJourney function that was here after module.exports

