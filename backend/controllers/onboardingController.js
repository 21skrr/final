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
  SupervisorAssessment,
} = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Parser } = require("json2csv");
const { v4: uuidv4 } = require("uuid");
const { getSystemSetting } = require("../utils/systemSettingsService");

// Employee: Get my onboarding progress (Read-only)
// GET /api/onboarding/progress/me
const getMyProgress = async (req, res) => {
  // Use the same logic as getUserOnboardingProgress, but for the current user
  req.params = req.params || {};
  req.params.userId = req.user.id;
  return getUserOnboardingProgress(req, res);
};

// GET /api/onboarding/progress/:userId
const getUserProgress = async (req, res) => {
  try {
    const requestingUser = req.user;
    const targetUserId = req.params.userId;

    // ====== Permission checks ======
    if (requestingUser.id === targetUserId) {
      // self access allowed
    } else if (requestingUser.role === "hr") {
      // HR access allowed
    } else if (requestingUser.role === "supervisor") {
      const user = await User.findByPk(targetUserId);
      if (!user || user.supervisorId !== requestingUser.id) {
        return res.status(403).json({
          message: "Supervisors can only view progress for their direct reports.",
        });
      }
    } else if (requestingUser.role === "manager") {
      const user = await User.findByPk(targetUserId);
      if (!user || user.department !== requestingUser.department) {
        return res.status(403).json({
          message: "Managers can only view progress for their department.",
        });
      }
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ====== Fetch onboarding progress record ======
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: targetUserId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department", "startDate"],
        },
      ],
    });

    if (!onboardingProgress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    const phases = ["prepare", "orient", "land", "integrate", "excel"];

    // ====== Fetch all tasks with user progress in one optimized query ======
    const allTasksWithProgress = await OnboardingTask.findAll({
      order: [['stage', 'ASC'], ['order', 'ASC']],
      include: [{
        model: UserTaskProgress,
        where: { UserId: targetUserId },
        required: false
      }]
    });

    // Create missing progress records if needed
    const tasksNeedingProgress = allTasksWithProgress.filter(
      task => !task.UserTaskProgresses || task.UserTaskProgresses.length === 0
    );

    if (tasksNeedingProgress.length > 0) {
      await UserTaskProgress.bulkCreate(
        tasksNeedingProgress.map(task => ({
          UserId: targetUserId,
          OnboardingTaskId: task.id,
          isCompleted: false,
          hrValidated: false
        }))
      );
    }

    // ====== Build tasksByPhase and calculate progress ======
    const progress = {};
    const tasksByPhase = {};
    let totalCompletedTasks = 0;
    let totalTasks = 0;

    phases.forEach(phase => {
      // Get tasks for this phase
      const phaseTasks = allTasksWithProgress.filter(t => t.stage === phase);
      
      // Format tasks for response
      tasksByPhase[phase] = phaseTasks.map(task => {
        const userProgress = task.UserTaskProgresses?.[0] || {};
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          stage: task.stage,
          order: task.order,
          controlledBy: task.controlledBy,
          isDefault: task.isDefault,
          isCompleted: userProgress.isCompleted || false,
          completedAt: userProgress.completedAt || null,
          hrValidated: userProgress.hrValidated || false,
          notes: userProgress.notes || null,
          progressId: userProgress.id || null
        };
      });

      // Calculate phase progress (only based on isCompleted)
      const completedInPhase = tasksByPhase[phase].filter(t => t.isCompleted).length;
      const totalInPhase = tasksByPhase[phase].length;
      
      progress[phase] = totalInPhase > 0 
        ? Math.round((completedInPhase / totalInPhase) * 100)
        : 0;
      
      // Accumulate for overall progress
      totalCompletedTasks += completedInPhase;
      totalTasks += totalInPhase;
    });

    // Calculate overall progress
    progress.overall = totalTasks > 0
      ? Math.round((totalCompletedTasks / totalTasks) * 100)
      : 0;

    // ====== Update onboarding progress record ======
    const newStatus = progress.overall === 100 ? "completed" : "in_progress";
    await onboardingProgress.update({
      progress: progress.overall,
      status: newStatus,
    });

    // Determine current stage (first incomplete phase)
    let currentStage = onboardingProgress.stage;
    for (const phase of phases) {
      if (progress[phase] < 100) {
        currentStage = phase;
        break;
      }
    }

    // If all phases complete, set to last phase
    if (phases.every(phase => progress[phase] === 100)) {
      currentStage = phases[phases.length - 1];
    }

    // ====== Build and send response ======
    res.json({
      progress,
      tasksByPhase,
      currentStage,
      stageStartDate: onboardingProgress.stageStartDate,
      estimatedCompletionDate: onboardingProgress.estimatedCompletionDate,
      status: newStatus,
      user: onboardingProgress.User,
      canEdit:
        requestingUser.role === "hr" ||
        (requestingUser.role === "supervisor" && requestingUser.id !== targetUserId),
      canAdvance:
        requestingUser.role === "hr" ||
        (requestingUser.role === "supervisor" && requestingUser.id !== targetUserId),
      canValidate: requestingUser.role === "hr",
    });

  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Get all onboarding progresses
// GET /api/onboarding/progress
const getAllProgresses = async (req, res) => {
  try {
    let progresses;
    if (req.user.role === "hr") {
      // HR: all progresses
      progresses = await OnboardingProgress.findAll({
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
    } else if (req.user.role === "manager") {
      // Manager: only employees in their department
      progresses = await OnboardingProgress.findAll({
        include: [
          {
            model: User,
            where: { department: req.user.department, role: "employee" },
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
    } else if (req.user.role === "supervisor") {
      // Supervisor: only direct reports
      progresses = await OnboardingProgress.findAll({
        include: [
          {
            model: User,
            where: { supervisorId: req.user.id, role: "employee" },
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
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }
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
    return res.status(403).json({
      message: "Employees cannot update their own onboarding progress",
    });
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
        return res.status(403).json({
          message: "Supervisors can only update their direct reports' progress",
        });
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
    } else if (requestingUser.role === "hr") {
      // HR can view any journey.
    } else if (requestingUser.role === "supervisor") {
      const user = await User.findByPk(userId);
      if (!user || user.supervisorId !== requestingUser.id) {
        return res.status(403).json({
          message: "Supervisors can only view their team members' journeys.",
        });
      }
    } else {
      // Deny access if none of the above conditions are met.
      return res
        .status(403)
        .json({ message: "Not authorized to view this journey" });
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

    if (requestingUser.role === "hr") {
      // HR can see all, or a specific user if userId is provided
      if (userId) {
        whereClause.UserId = userId;
      }
    } else if (requestingUser.role === "supervisor") {
      // Supervisor can see their subordinates or themselves
      const subordinateIds = (
        await User.findAll({
          where: { supervisorId: requestingUser.id },
          attributes: ["id"],
        })
      ).map((u) => u.id);

      // Allow supervisor to also query their own progress
      subordinateIds.push(requestingUser.id);

      if (userId) {
        // If a specific user is requested, they must be a subordinate
        if (!subordinateIds.includes(userId)) {
          return res.status(403).json({
            message: "You are not authorized to view this user's progress.",
          });
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
    if (
      userId ||
      (requestingUser.role !== "hr" && requestingUser.role !== "supervisor")
    ) {
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
    const fields = [
      "User.id",
      "User.name",
      "User.email",
      "User.role",
      "User.department",
      "User.startDate",
      "stage",
      "progress",
      "status",
      "createdAt",
      "updatedAt",
    ];
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
      return res
        .status(400)
        .json({ message: "One or more checklists not found" });
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

// HR/Manager/Supervisor: Reset employee's journey
// POST /api/onboarding/journey/:userId/reset
const resetJourney = async (req, res) => {
  try {
    const { userId } = req.params;
    const { resetToStage = "pre_onboarding", keepCompletedTasks = false } = req.body;

    // Allow HR, manager, or supervisor to reset journey (all treated the same)
    if (!["hr", "manager", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "HR access only" });
    }

    // No special restrictions for manager/supervisor, all same as HR

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
        pre_onboarding: progresses.filter((p) => p.stage === "pre_onboarding").length,
        phase_1: progresses.filter((p) => p.stage === "phase_1").length,
        phase_2: progresses.filter((p) => p.stage === "phase_2").length,
      },
      byJourneyType: {
        SFP: progresses.filter((p) => p.journeyType === "SFP").length,
        CC: progresses.filter((p) => p.journeyType === "CC").length,
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
    const NotificationSettings = require("../models/NotificationSettings");
    let notificationSettings = await NotificationSettings.findOne({
      where: { userId: req.user.id, category: "onboarding" },
    });
    if (!notificationSettings) {
      // Return default settings if not set
      notificationSettings = {
        settings: {
          taskCompletionHR: true,
          taskCompletionEmployee: true,
          stageTransition: true,
          delayAlerts: true,
          newAssignments: true,
        },
      };
    }
    res.json(notificationSettings.settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/settings/notifications
const updateUserNotificationSettings = async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings data" });
    }
    let [notificationSettings, created] =
      await NotificationSettings.findOrCreate({
        where: { userId: req.user.id, category: "general" },
        defaults: { settings },
      });
    if (!created) {
      await notificationSettings.update({ settings });
    }
    res.json({
      message: "Notification settings updated successfully",
      settings: notificationSettings.settings,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Delete onboarding progress for an employee (optional)
// DELETE /api/onboarding/:userId
const deleteUserProgress = async (req, res) => {
  try {
    // Verify the user has permission
    if (
      req.user.role !== "hr" &&
      req.user.role !== "supervisor" &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const userId = req.params.userId;

    // Find the progress record
    const progress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Delete all related UserTaskProgress records first
    await UserTaskProgress.destroy({
      where: { UserId: userId },
    });

    // Then delete the main progress record
    await progress.destroy();

    res.json({
      message:
        "Onboarding journey and all related progress deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Add the createJourney function here, BEFORE module.exports
const createJourney = async (req, res) => {
  try {
    const { userId, journeyType } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!journeyType || !["SFP", "CC"].includes(journeyType)) {
      return res.status(400).json({ 
        message: "Journey type is required and must be either 'SFP' or 'CC'" 
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Security check for supervisors: only allow creating journeys for their direct reports
    if (req.user.role === "supervisor") {
      if (user.supervisorId !== req.user.id) {
        return res.status(403).json({ 
          message: "Supervisors can only create onboarding journeys for their direct reports" 
        });
      }
      
      // Ensure the target user is an employee
      if (user.role !== "employee") {
        return res.status(403).json({ 
          message: "Supervisors can only create onboarding journeys for employees" 
        });
      }
    }

    // Check if journey already exists
    const existingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (existingProgress) {
      return res
        .status(400)
        .json({ message: "Onboarding journey already exists for this user" });
    }

    // Create new onboarding progress
    const newProgress = await OnboardingProgress.create({
      UserId: userId,
      stage: "pre_onboarding",
      progress: 0,
      stageStartDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: "pending",
      journeyType: journeyType,
    });

    // Assign onboarding tasks based on journey type
    const OnboardingTask = require("../models/OnboardingTask");
    const UserTaskProgress = require("../models/UserTaskProgress")(
      require("../config/database")
    );
    
    // Get tasks that match the journey type (either specific to journey type or "both")
    const defaultTasks = await OnboardingTask.findAll({
      where: { 
        isDefault: true,
        journeyType: { [Op.or]: [journeyType, "both"] }
      },
    });
    
    const userTaskProgresses = defaultTasks.map((task) => ({
      UserId: userId,
      OnboardingTaskId: task.id,
      isCompleted: false,
    }));
    
    if (userTaskProgresses.length > 0) {
      await UserTaskProgress.bulkCreate(userTaskProgresses);
    }

    // Include user data in response
    const progressWithUser = await OnboardingProgress.findByPk(newProgress.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    res.status(201).json({
      message: "Onboarding journey created successfully",
      data: progressWithUser,
    });
  } catch (error) {
    console.error("Error creating onboarding journey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Calculate progress for a specific phase and user
const calculatePhaseProgress = async (userId, phase) => {
  // Get user's onboarding progress to determine journey type
  const userProgress = await OnboardingProgress.findOne({
    where: { UserId: userId },
  });

  if (!userProgress) {
    return 0;
  }

  // Get all tasks for this phase that match the user's journey type
  const tasks = await OnboardingTask.findAll({
    where: { 
      stage: phase,
      journeyType: { [Op.or]: [userProgress.journeyType, "both"] }
    },
  });
  if (tasks.length === 0) return 0;

  // Get user-specific progress for these tasks
  const userTaskProgresses = await UserTaskProgress.findAll({
    where: {
      UserId: userId,
      OnboardingTaskId: tasks.map((t) => t.id),
    },
  });

  // Count completed and validated tasks for this user in this phase
  const completed = userTaskProgresses.filter(
    (utp) => utp.isCompleted
  ).length;
  return Math.round((completed / tasks.length) * 100);
};

// Get user's onboarding progress
const getUserOnboardingProgress = async (req, res) => {
  const { userId } = req.params;
  try {
    // Security check for supervisors: only allow access to their direct reports
    if (req.user.role === "supervisor") {
      const targetUser = await User.findByPk(userId);
      if (!targetUser || targetUser.supervisorId !== req.user.id) {
        return res.status(403).json({ 
          message: "Supervisors can only view onboarding progress for their direct reports" 
        });
      }
    }

    const phases = ["pre_onboarding", "phase_1", "phase_2"];
    const progress = {};
    const tasksByPhase = {};

    // Get user's onboarding progress record
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });
    if (!onboardingProgress) {
      return res
        .status(404)
        .json({ error: "Onboarding progress not found for user" });
    }

    // Get supervisor assessment information
    const SupervisorAssessment = require("../models/SupervisorAssessment");
    const supervisorAssessment = await SupervisorAssessment.findOne({
      where: { OnboardingProgressId: onboardingProgress.id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'hrValidator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Get HR assessment information
    const HRAssessment = require("../models/HRAssessment");
    const hrAssessment = await HRAssessment.findOne({
      where: { OnboardingProgressId: onboardingProgress.id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'hr',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // For each phase, get all tasks and merge with user-specific progress
    for (const phase of phases) {
      const tasks = await OnboardingTask.findAll({
        where: { 
          stage: phase,
          journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
        },
        order: [["order", "ASC"]],
      });

      // Ensure every task has a UserTaskProgress for this user
      for (const task of tasks) {
        const userTask = await UserTaskProgress.findOne({
          where: { UserId: userId, OnboardingTaskId: task.id },
        });
        if (!userTask) {
          await UserTaskProgress.create({
            UserId: userId,
            OnboardingTaskId: task.id,
            isCompleted: false,
            hrValidated: false,
          });
        }
      }

      // Now fetch with user progress as before
      const tasksWithUserProgress = await Promise.all(
        tasks.map(async (task) => {
          const userTask = await UserTaskProgress.findOne({
            where: { UserId: userId, OnboardingTaskId: task.id },
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
            progressId: userTask ? userTask.id : null,
          };
        })
      );
      tasksByPhase[phase] = tasksWithUserProgress;
      progress[phase] = await calculatePhaseProgress(userId, phase);
    }

    // --- AUTO ADVANCE PHASE LOGIC ---
    // Find the first phase that is not 100% completed/validated
    let newStage = onboardingProgress.stage;
    for (const phase of phases) {
      if (progress[phase] < 100) {
        newStage = phase;
        break;
      }
    }
    // If all phases are 100%, set to last phase
    if (phases.every((phase) => progress[phase] === 100)) {
      newStage = "phase_2";
    }

    // If the stage has changed, update onboardingProgress
    if (onboardingProgress.stage !== newStage) {
      await onboardingProgress.update({
        stage: newStage,
        stageStartDate: new Date(),
      });
    }

    // Calculate overall progress (percentage of completed tasks for this user)
    const allUserTasks = await UserTaskProgress.findAll({
      where: { UserId: userId },
    });
    const completed = allUserTasks.filter((task) => task.isCompleted).length;
    progress.overall =
      allUserTasks.length === 0
        ? 0
        : Math.round((completed / allUserTasks.length) * 100);

    // Update progress in onboardingprogresses table
    await onboardingProgress.update({
      progress: progress.overall,
      status: progress.overall === 100 ? "completed" : "in_progress",
    });

    res.json({
      progress,
      tasksByPhase,
      currentStage: newStage,
      status: onboardingProgress.status,
      stageStartDate: onboardingProgress.stageStartDate,
      estimatedCompletionDate: onboardingProgress.estimatedCompletionDate,
      supervisorAssessment: supervisorAssessment ? {
        id: supervisorAssessment.id,
        status: supervisorAssessment.status,
        supervisorDecision: supervisorAssessment.supervisorDecision,
        supervisorComments: supervisorAssessment.supervisorComments,
        hrDecision: supervisorAssessment.hrDecision,
        hrDecisionComments: supervisorAssessment.hrDecisionComments,
        hrDecisionDate: supervisorAssessment.hrDecisionDate,
        employee: supervisorAssessment.employee,
        supervisor: supervisorAssessment.supervisor,
        hrValidator: supervisorAssessment.hrValidator
      } : null,
      hrAssessment: hrAssessment ? {
        id: hrAssessment.id,
        status: hrAssessment.status,
        hrDecision: hrAssessment.hrDecision,
        hrDecisionComments: hrAssessment.hrDecisionComments,
        hrDecisionDate: hrAssessment.hrDecisionDate,
        employee: hrAssessment.employee,
        hr: hrAssessment.hr
      } : null
    });
  } catch (error) {
    console.error("Error getting user onboarding progress:", error);
    res.status(500).json({ error: "Failed to get onboarding progress" });
  }
};

// Update task completion and validation status (Supervisor/HR only)
const updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { completed, hrValidated } = req.body;

  try {
    // Check if user can edit tasks
    if (!["hr", "supervisor"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Task editing not allowed for this role" });
    }

    const task = await OnboardingTask.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // For supervisors, check if they're editing their direct report's task
    if (req.user.role === "supervisor") {
      const userTaskProgress = await UserTaskProgress.findOne({
        where: { OnboardingTaskId: taskId },
      });

      if (userTaskProgress) {
        const targetUser = await User.findByPk(userTaskProgress.UserId);
        if (!targetUser || targetUser.supervisorId !== req.user.id) {
          return res.status(403).json({
            error: "Supervisors can only edit their direct reports' tasks",
          });
        }
      }
    }

    await task.update({
      completed: completed !== undefined ? completed : task.completed,
      hrValidated: hrValidated !== undefined ? hrValidated : task.hrValidated,
    });

    // Get updated phase progress
    const phaseProgress = await calculatePhaseProgress(req.user.id, task.stage);

    res.json({
      message: "Task status updated successfully",
      task,
      phaseProgress,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
};

// Get all default onboarding tasks grouped by stage (HR only)
const getDefaultTasks = async (req, res) => {
  try {
    // Allow employees and HR to access default tasks
    if (!["hr", "employee"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only HR and employees can access default tasks" });
    }

    // Get user's onboarding progress to determine journey type
    let journeyType = "both"; // Default for HR viewing all tasks
    if (req.user.role === "employee") {
      const userProgress = await OnboardingProgress.findOne({
        where: { UserId: req.user.id },
      });
      if (userProgress) {
        journeyType = userProgress.journeyType;
      }
    }

    const tasks = await OnboardingTask.findAll({
      where: { 
        isDefault: 1,
        journeyType: { [Op.or]: [journeyType, "both"] }
      },
      order: [
        ["stage", "ASC"],
        ["order", "ASC"],
      ],
    });
    
    // Group by stage
    const grouped = {};
    tasks.forEach((task) => {
      if (!grouped[task.stage]) grouped[task.stage] = [];
      grouped[task.stage].push(task);
    });
    
    res.json({
      tasks: grouped,
      journeyType: journeyType
    });
  } catch (error) {
    console.error("Error fetching default onboarding tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Advance to next onboarding phase (Supervisor/HR only)
const advanceToNextPhase = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can advance phases
    if (!["hr", "supervisor"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Phase advancement not allowed for this role" });
    }

    // For supervisors, check if they're advancing their direct report's phase
    if (req.user.role === "supervisor") {
      const targetUser = await User.findByPk(userId);
      if (!targetUser || targetUser.supervisorId !== req.user.id) {
        return res.status(403).json({
          message: "Supervisors can only advance their direct reports' phases",
        });
      }
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });
    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }
    const stages = ["pre_onboarding", "phase_1", "phase_2"];
    const currentIndex = stages.indexOf(progress.stage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return res.status(400).json({
        message: "Cannot advance: already at last stage or invalid stage",
      });
    }
    const nextStage = stages[currentIndex + 1];
    
    // If advancing from Phase 1 to Phase 2, check if supervisor assessment is required
    if (progress.stage === "phase_1" && nextStage === "phase_2") {
      // Check if all Phase 1 tasks are completed
      const phase1Tasks = await OnboardingTask.findAll({
        where: { 
          stage: "phase_1",
          journeyType: { [Op.or]: [progress.journeyType, "both"] }
        },
      });

      const userTaskProgress = await UserTaskProgress.findAll({
        where: { 
          UserId: userId,
          OnboardingTaskId: { [Op.in]: phase1Tasks.map(task => task.id) }
        },
      });

      const allTasksCompleted = phase1Tasks.length > 0 && 
        userTaskProgress.length === phase1Tasks.length &&
        userTaskProgress.every(task => task.isCompleted);

      if (allTasksCompleted) {
        // Check if supervisor assessment exists and is approved
        const SupervisorAssessment = require("../models/SupervisorAssessment");
        const assessment = await SupervisorAssessment.findOne({
          where: { OnboardingProgressId: progress.id }
        });

        if (!assessment || assessment.status !== "hr_validated" || !assessment.hrValidated) {
          return res.status(400).json({
            message: "Supervisor assessment must be completed and HR validated before advancing to Phase 2"
          });
        }
      }
    }

    await progress.update({
      stage: nextStage,
      stageStartDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const updated = await OnboardingProgress.findOne({
      where: { UserId: userId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });
    res.json(updated);
  } catch (error) {
    console.error("Error advancing onboarding phase:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get detailed progress for all phases (Employee only - read-only)
const getDetailedProgress = async (req, res) => {
  try {
    // Only employees can access their own detailed progress
    if (req.user.role !== "employee") {
      return res.status(403).json({
        message: "Only employees can access their own detailed progress",
      });
    }

    const phases = ["pre_onboarding", "phase_1", "phase_2"];
    const progress = {};
    const tasksByPhase = {};

    // Get user's onboarding progress to determine journey type
    const userProgress = await OnboardingProgress.findOne({
      where: { UserId: req.user.id },
    });

    if (!userProgress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Calculate progress for each phase and get tasks
    for (const phase of phases) {
      progress[phase] = await calculatePhaseProgress(req.user.id, phase);
      tasksByPhase[phase] = await OnboardingTask.findAll({
        where: { 
          stage: phase,
          journeyType: { [Op.or]: [userProgress.journeyType, "both"] }
        },
        order: [["order", "ASC"]],
        attributes: [
          "id",
          "title",
          "stage",
          "completed",
          "hrValidated",
          "order",
          "journeyType",
        ],
      });
    }

    // Calculate overall progress
    const totalTasks = await OnboardingTask.count();
    const totalValidated = await OnboardingTask.count({
      where: { completed: true, hrValidated: true },
    });

    progress.overall =
      totalTasks === 0 ? 0 : Math.round((totalValidated / totalTasks) * 100);

    res.json({
      progress,
      tasksByPhase,
      totalTasks,
      totalValidated,
      canEdit: false, // Employees cannot edit tasks
    });
  } catch (error) {
    console.error("Error calculating progress:", error);
    res.status(500).json({ error: "Failed to calculate progress" });
  }
};

// HR validates a task (HR only)
const validateTask = async (req, res) => {
  const { taskId } = req.params;
  const { userId, comments } = req.body;

  try {
    // Only HR can validate tasks
    if (req.user.role !== "hr") {
      return res.status(403).json({ error: "Only HR can validate tasks" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Find the user's task progress
    const userTaskProgress = await UserTaskProgress.findOne({
      where: {
        UserId: userId,
        OnboardingTaskId: taskId,
      },
    });

    if (!userTaskProgress) {
      return res.status(404).json({ error: "User task progress not found" });
    }

    if (userTaskProgress.hrValidated) {
      return res.status(400).json({ error: "Task already validated" });
    }

    await userTaskProgress.update({
      hrValidated: true,
      hrValidatedAt: new Date(),
      hrComments: comments || null,
    });

    // Get updated phase progress
    const phaseProgress = await calculatePhaseProgress(
      userId,
      userTaskProgress.stage
    );

    res.json({
      message: "Task validated successfully",
      userTaskProgress,
      phaseProgress,
    });
  } catch (error) {
    console.error("Error validating task:", error);
    res.status(500).json({ error: "Failed to validate task" });
  }
};

// Update task completion status (Supervisor/HR only)
const updateTaskCompletion = async (req, res) => {
  const { taskId } = req.params;
  const { completed, userId } = req.body;

  console.log(`[DEBUG] updateTaskCompletion called - taskId: ${taskId}, completed: ${completed}, userId: ${userId}, role: ${req.user.role}`);

  try {
    // Check if user can edit tasks
    if (!["hr", "supervisor"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Task editing not allowed for this role" });
    }

    const task = await OnboardingTask.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // For supervisors, check if they're editing their direct report's task
    if (req.user.role === "supervisor") {
      const userTaskProgress = await UserTaskProgress.findOne({
        where: { OnboardingTaskId: taskId },
      });

      if (userTaskProgress) {
        const targetUser = await User.findByPk(userTaskProgress.UserId);
        
      }
    }

    // Update the OnboardingTask.completed field
    await task.update({ completed });

    // Always require userId and only update that user's progress
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const userTaskProgress = await UserTaskProgress.findOne({
      where: {
        OnboardingTaskId: taskId,
        UserId: userId,
      },
    });

    if (userTaskProgress) {
      await userTaskProgress.update({
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
      });
    }

    res.json({
      message: "Task completion status updated for the user",
      task,
    });

    // Check if Phase 1 is completed and trigger supervisor assessment
    await checkAndTriggerSupervisorAssessment(userId);
    
    // Check if Phase 2 is completed and trigger HR assessment
    await checkAndTriggerHRAssessment(userId);
  } catch (error) {
    console.error("Error updating task completion:", error);
    res.status(500).json({ error: "Failed to update task completion" });
  }
};

// Debug endpoint to check user's Phase 1 status
const debugPhase1Status = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!onboardingProgress) {
      return res.status(404).json({ error: "No onboarding progress found" });
    }

    const phase1Tasks = await OnboardingTask.findAll({
      where: { 
        stage: "phase_1",
        journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
      },
    });

    const userTaskProgress = await UserTaskProgress.findAll({
      where: { 
        UserId: userId,
        OnboardingTaskId: { [Op.in]: phase1Tasks.map(task => task.id) }
      },
    });

    const user = await User.findByPk(userId);
    
    const SupervisorAssessment = require("../models/SupervisorAssessment");
    const existingAssessment = await SupervisorAssessment.findOne({
      where: { OnboardingProgressId: onboardingProgress.id }
    });

    res.json({
      userId,
      onboardingProgress: {
        id: onboardingProgress.id,
        stage: onboardingProgress.stage,
        journeyType: onboardingProgress.journeyType
      },
      phase1Tasks: phase1Tasks.map(t => ({ id: t.id, title: t.title, journeyType: t.journeyType })),
      userTaskProgress: userTaskProgress.map(p => ({ 
        taskId: p.OnboardingTaskId, 
        isCompleted: p.isCompleted,
        completedAt: p.completedAt
      })),
      user: {
        id: user.id,
        name: user.name,
        supervisorId: user.supervisorId
      },
      existingAssessment: existingAssessment ? {
        id: existingAssessment.id,
        status: existingAssessment.status
      } : null,
      allTasksCompleted: phase1Tasks.length > 0 && 
        userTaskProgress.length === phase1Tasks.length &&
        userTaskProgress.every(task => task.isCompleted)
    });
  } catch (error) {
    console.error("Error debugging Phase 1 status:", error);
    res.status(500).json({ error: "Failed to debug Phase 1 status" });
  }
};

// Check if Phase 1 is completed and trigger supervisor assessment
const checkAndTriggerSupervisorAssessment = async (userId) => {
  try {
    console.log(`[DEBUG] Checking supervisor assessment trigger for user ${userId}`);
    
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!onboardingProgress) {
      console.log(`[DEBUG] No onboarding progress found for user ${userId}`);
      return;
    }

    console.log(`[DEBUG] User ${userId} current stage: ${onboardingProgress.stage}`);

    // Check if Phase 1 is completed using either the NEW system or LEGACY system
    let phase1Completed = false;
    
    if (onboardingProgress.stage === "phase_1" || onboardingProgress.stage === "phase_2") {
      // NEW system - check if all Phase 1 tasks are completed
      console.log(`[DEBUG] Using NEW system - checking phase_1 tasks`);
      
      const phase1Tasks = await OnboardingTask.findAll({
        where: { 
          stage: "phase_1",
          journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
        },
      });

      console.log(`[DEBUG] Found ${phase1Tasks.length} phase_1 tasks for journey type ${onboardingProgress.journeyType}`);

      if (phase1Tasks.length > 0) {
        const userTaskProgress = await UserTaskProgress.findAll({
          where: { 
            UserId: userId,
            OnboardingTaskId: { [Op.in]: phase1Tasks.map(task => task.id) }
          },
        });

        console.log(`[DEBUG] User has progress on ${userTaskProgress.length} tasks`);
        console.log(`[DEBUG] Completed tasks: ${userTaskProgress.filter(t => t.isCompleted).length}`);

        phase1Completed = phase1Tasks.length > 0 && 
          userTaskProgress.length === phase1Tasks.length &&
          userTaskProgress.every(task => task.isCompleted);

        console.log(`[DEBUG] NEW system - All Phase 1 tasks completed: ${phase1Completed}`);
      }
    } else {
      // LEGACY system - check orient, land, integrate, excel progress
      console.log(`[DEBUG] Using LEGACY system - checking orient, land, integrate, excel progress`);
      
      const orientCompleted = onboardingProgress.orientProgress >= 100;
      const landCompleted = onboardingProgress.landProgress >= 100;
      const integrateCompleted = onboardingProgress.integrateProgress >= 100;
      const excelCompleted = onboardingProgress.excelProgress >= 100;
      
      // Consider Phase 1 completed if orient and land are both 100%
      phase1Completed = orientCompleted && landCompleted;
      
      console.log(`[DEBUG] LEGACY system - Orient: ${onboardingProgress.orientProgress}%, Land: ${onboardingProgress.landProgress}%, Integrate: ${onboardingProgress.integrateProgress}%, Excel: ${onboardingProgress.excelProgress}%`);
      console.log(`[DEBUG] LEGACY system - Phase 1 completed (orient + land): ${phase1Completed}`);
    }

    if (phase1Completed) {
      // Check if supervisor assessment already exists
      const SupervisorAssessment = require("../models/SupervisorAssessment");
      const existingAssessment = await SupervisorAssessment.findOne({
        where: { OnboardingProgressId: onboardingProgress.id }
      });

      if (existingAssessment) {
        console.log(`[DEBUG] Supervisor assessment already exists for user ${userId}`);
        return;
      }

      // Get the user's supervisor
      const user = await User.findByPk(userId);
      console.log(`[DEBUG] User ${userId} supervisor ID: ${user?.supervisorId}`);
      
      if (user && user.supervisorId) {
        // Create supervisor assessment
        const assessment = await SupervisorAssessment.create({
          OnboardingProgressId: onboardingProgress.id,
          UserId: userId,
          SupervisorId: user.supervisorId,
          status: "pending_certificate",
          phase1CompletedDate: new Date(),
        });

        console.log(`[SUCCESS] Supervisor assessment created for user ${userId}`);

        // Send notification to supervisor
        try {
          const { sendNotification } = require('../utils/notificationHelper');
          await sendNotification({
            userId: user.supervisorId,
            type: 'system_alert', // Use existing type temporarily
            title: 'Supervisor Assessment Required',
            message: `${user.name} has completed Phase 1 of onboarding and requires your assessment. Please review their progress and complete the assessment.`,
            metadata: {
              assessmentId: assessment.id,
              employeeId: userId,
              employeeName: user.name,
              type: 'supervisor_assessment'
            }
          });
          console.log(`[SUCCESS] Notification sent to supervisor ${user.supervisorId}`);
        } catch (notificationError) {
          console.error(`[ERROR] Failed to send notification to supervisor:`, notificationError);
        }

        // Also send notification to the employee
        try {
          const { sendNotification } = require('../utils/notificationHelper');
          await sendNotification({
            userId: userId,
            type: 'system_alert', // Use existing type temporarily
            title: 'Assessment Pending',
            message: 'You have completed Phase 1! Your supervisor will now assess your progress before you can proceed to Phase 2.',
            metadata: {
              assessmentId: assessment.id,
              type: 'supervisor_assessment_pending'
            }
          });
          console.log(`[SUCCESS] Notification sent to employee ${userId}`);
        } catch (notificationError) {
          console.error(`[ERROR] Failed to send notification to employee:`, notificationError);
        }
      } else {
        console.log(`[ERROR] User ${userId} does not have a supervisor assigned`);
      }
    } else {
      console.log(`[DEBUG] Phase 1 not completed for user ${userId}, skipping assessment creation`);
    }
  } catch (error) {
    console.error("Error checking and triggering supervisor assessment:", error);
  }
};

// Check if Phase 2 is completed and trigger HR assessment
const checkAndTriggerHRAssessment = async (userId) => {
  try {
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!onboardingProgress || onboardingProgress.stage !== "phase_2") {
      return;
    }

    // Check if all Phase 2 tasks are completed
    const phase2Tasks = await OnboardingTask.findAll({
      where: { 
        stage: "phase_2",
        journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
      },
    });

    const userTaskProgress = await UserTaskProgress.findAll({
      where: { 
        UserId: userId,
        OnboardingTaskId: { [Op.in]: phase2Tasks.map(task => task.id) }
      },
    });

    const allTasksCompleted = phase2Tasks.length > 0 && 
      userTaskProgress.length === phase2Tasks.length &&
      userTaskProgress.every(task => task.isCompleted);

    if (allTasksCompleted) {
      // Check if HR assessment already exists
      const HRAssessment = require("../models/HRAssessment");
      const existingAssessment = await HRAssessment.findOne({
        where: { OnboardingProgressId: onboardingProgress.id }
      });

      if (!existingAssessment) {
        // Get an HR user (you might want to implement a more sophisticated way to assign HR)
        const hrUser = await User.findOne({
          where: { role: "hr" },
          order: [['createdAt', 'ASC']] // Get the first HR user
        });

        if (hrUser) {
          // Create HR assessment
          await HRAssessment.create({
            OnboardingProgressId: onboardingProgress.id,
            UserId: userId,
            HRId: hrUser.id,
            status: "pending_assessment",
            phase2CompletedDate: new Date(),
            assessmentRequestedDate: new Date(),
          });

          console.log(`HR assessment triggered for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking and triggering HR assessment:", error);
  }
};

// Get tasks by phase (Employee only - read-only)
const getTasksByPhase = async (req, res) => {
  try {
    // Only employees can access phase-specific tasks
    if (req.user.role !== "employee") {
      return res
        .status(403)
        .json({ message: "Only employees can access phase-specific tasks" });
    }

    const { phase } = req.params;
    
    // Get user's onboarding progress to determine journey type
    const userProgress = await OnboardingProgress.findOne({
      where: { UserId: req.user.id },
    });

    if (!userProgress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Check if this is Phase 2 and if HR has approved the supervisor assessment
    if (phase === "phase_2") {
      const SupervisorAssessment = require("../models/SupervisorAssessment");
      const supervisorAssessment = await SupervisorAssessment.findOne({
        where: { OnboardingProgressId: userProgress.id }
      });

      if (supervisorAssessment && 
          supervisorAssessment.status !== "hr_approved" && 
          supervisorAssessment.status !== "completed") {
        // Return empty tasks for Phase 2 if not approved
        return res.json({
          phase,
          tasks: [],
          progress: 0,
          journeyType: userProgress.journeyType,
          canEdit: false,
          assessmentStatus: supervisorAssessment.status,
          assessmentMessage: supervisorAssessment.status === "hr_rejected" 
            ? "Your Phase 1 assessment has been rejected by HR." 
            : "Your Phase 1 assessment is under review by HR."
        });
      }
    }

    const tasks = await OnboardingTask.findAll({
      where: { 
        stage: phase,
        journeyType: { [Op.or]: [userProgress.journeyType, "both"] }
      },
      attributes: [
        "id",
        "title",
        "description",
        "stage",
        "completed",
        "hrValidated",
        "order",
        "journeyType",
      ],
      order: [["order", "ASC"]],
    });

    const progress = await calculatePhaseProgress(req.user.id, phase);

    res.json({
      phase,
      tasks,
      progress,
      journeyType: userProgress.journeyType,
      canEdit: false, // Employees cannot edit tasks
    });
  } catch (error) {
    console.error("Error fetching tasks by phase:", error);
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

// Validate user task progress
const validateUserTaskProgress = async (req, res) => {
  const { userTaskProgressId } = req.params;
  const { comments } = req.body;

  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ error: "Only HR can validate tasks" });
    }

    const userTaskProgress = await UserTaskProgress.findByPk(
      userTaskProgressId
    );

    if (!userTaskProgress) {
      return res.status(404).json({ error: "User task progress not found" });
    }

    if (userTaskProgress.hrValidated) {
      return res.status(400).json({ error: "Task already validated" });
    }

    await userTaskProgress.update({
      hrValidated: true,
      hrValidatedAt: new Date(),
      hrComments: comments || null,
    });

    res.json({
      message: "Task validated successfully",
      userTaskProgress,
    });
  } catch (error) {
    console.error("Error validating user task progress:", error);
    res.status(500).json({ error: "Failed to validate user task progress" });
  }
};

// Get available journey types
const getJourneyTypes = async (req, res) => {
  try {
    const journeyTypes = [
      { value: "SFP", label: "SFP (Smoke Free Product)" },
      { value: "CC", label: "CC (Conventional Cigarette)" }
    ];
    
    res.json({
      journeyTypes,
      message: "Available journey types retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching journey types:", error);
    res.status(500).json({ message: "Internal server error" });
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
  getTasksByPhase,
  validateUserTaskProgress,
  getJourneyTypes,
  debugPhase1Status,
};
