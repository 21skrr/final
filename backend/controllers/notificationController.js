const { Notification, CoachingSession, User, Team, OnboardingProgress, ChecklistAssignment, Task, FeedbackSubmission, FeedbackForm, notification_preferences, NotificationTemplate } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../models");
const { v4: uuidv4 } = require('uuid');

// Get user's notifications
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const notification = await Notification.create({
      userId,
      message,
      type,
      isRead: false,
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    await notification.update({ isRead: true });
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    await notification.destroy();
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all notifications (admin/RH only)
const getAllNotifications = async (req, res) => {
  try {
    const { type, userId, from, to } = req.query;
    const where = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (from || to) where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get reminders
const getReminders = async (req, res) => {
  try {
    const reminders = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "reminder",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get document notifications
const getDocumentNotifications = async (req, res) => {
  try {
    const documents = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "document",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching document notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get training notifications
const getTrainingNotifications = async (req, res) => {
  try {
    const training = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "training",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(training);
  } catch (error) {
    console.error("Error fetching training notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get coaching session notifications
const getCoachingSessionNotifications = async (req, res) => {
  try {
    const coachingSessions = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "coaching_session",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(coachingSessions);
  } catch (error) {
    console.error("Error fetching coaching session notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team progress notifications (supervisor only)
const getTeamProgress = async (req, res) => {
  try {
    // Get team members first
    const teamMembers = await User.findAll({
      where: { supervisorId: req.user.id },
      attributes: ['id']
    });
    const teamMemberIds = teamMembers.map(member => member.id);

    // Get notifications for all team members
    const teamProgress = await Notification.findAll({
      where: {
        userId: { [Op.in]: [...teamMemberIds, req.user.id] },
        type: "team_progress",
        isRead: false,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(teamProgress);
  } catch (error) {
    console.error("Error fetching team progress notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get overdue tasks notifications
const getOverdueTasks = async (req, res) => {
  try {
    const overdueTasks = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "overdue_task",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(overdueTasks);
  } catch (error) {
    console.error("Error fetching overdue tasks notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback availability notifications
const getFeedbackAvailability = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "feedback_available",
        isRead: false,
      },
      include: [
        {
          model: FeedbackForm,
          attributes: ["id", "title", "type", "dueDate"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching feedback availability notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback submissions notifications
const getFeedbackSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    let whereClause = {};
    
    // If user is supervisor or HR, they can see submissions from their team
    if (["supervisor", "hr"].includes(req.user.role)) {
      const teamMembers = await User.findAll({
        where: { supervisorId: userId },
        attributes: ["id"],
      });
      const teamMemberIds = teamMembers.map(member => member.id);
      whereClause = {
        userId: { [Op.in]: [...teamMemberIds, userId] },
      };
    } else {
      // Regular users only see their own submissions
      whereClause = { userId };
    }

    const notifications = await Notification.findAll({
      where: {
        ...whereClause,
        type: "feedback_submission",
        isRead: false,
      },
      include: [
        {
          model: FeedbackSubmission,
          attributes: ["id", "submittedAt", "status"],
          include: [
            {
              model: FeedbackForm,
              attributes: ["id", "title", "type"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching feedback submission notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get weekly progress reports
const getWeeklyReports = async (req, res) => {
  try {
    const { department, week } = req.query;
    let where = {
      type: "weekly_report",
      isRead: false,
    };

    // Build metadata conditions
    const metadataConditions = [];
    
    if (department) {
      metadataConditions.push(
        sequelize.where(
          sequelize.cast(sequelize.json('metadata.department'), 'text'),
          department
        )
      );
    }

    if (week) {
      metadataConditions.push(
        sequelize.where(
          sequelize.cast(sequelize.json('metadata.week'), 'text'),
          week
        )
      );
    }

    // Add metadata conditions if any exist
    if (metadataConditions.length > 0) {
      where = {
        ...where,
        [Op.and]: metadataConditions
      };
    }

    const reports = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching weekly reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get compliance alerts
const getComplianceAlerts = async (req, res) => {
  try {
    const alerts = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "compliance",
        isRead: false,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching compliance alerts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get leave request notifications
const getLeaveRequests = async (req, res) => {
  try {
    let whereClause = {
      type: "leave_request",
      isRead: false,
    };

    // If user is supervisor or HR, they can see their team's leave requests
    if (["supervisor", "hr"].includes(req.user.role)) {
      const teamMembers = await User.findAll({
        where: { supervisorId: req.user.id },
        attributes: ["id"],
      });
      const teamMemberIds = teamMembers.map(member => member.id);
      whereClause.userId = { [Op.in]: [...teamMemberIds, req.user.id] };
    } else {
      // Regular users only see their own leave requests
      whereClause.userId = req.user.id;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching leave request notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's notification preferences
const getNotificationPreferences = async (req, res) => {
  try {
    let preferences = await notification_preferences.findOne({
      where: { userId: req.user.id },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await notification_preferences.create({
        userId: req.user.id,
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user's notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, notificationTypes, quietHours } = req.body;

    let preferences = await notification_preferences.findOne({
      where: { userId: req.user.id },
    });

    if (!preferences) {
      preferences = await notification_preferences.create({
        userId: req.user.id,
        emailNotifications,
        pushNotifications,
        notificationTypes,
        quietHours,
      });
    } else {
      await preferences.update({
        emailNotifications: emailNotifications !== undefined ? emailNotifications : preferences.emailNotifications,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : preferences.pushNotifications,
        notificationTypes: notificationTypes !== undefined ? notificationTypes : preferences.notificationTypes,
        quietHours: quietHours !== undefined ? quietHours : preferences.quietHours,
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get notification templates (HR only)
const getNotificationTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create notification template (HR only)
const createNotificationTemplate = async (req, res) => {
  try {
    const { name, title, message, type, metadata } = req.body;

    const template = await NotificationTemplate.create({
      id: uuidv4(),
      name,
      title,
      message,
      type,
      metadata,
      createdBy: req.user.id,
      isActive: true
    });

    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating notification template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single notification template
const getNotificationTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching notification template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update notification template
const updateNotificationTemplate = async (req, res) => {
  try {
    const { name, title, message, type, metadata } = req.body;
    const template = await NotificationTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    await template.update({
      name: name || template.name,
      title: title || template.title,
      message: message || template.message,
      type: type || template.type,
      metadata: metadata || template.metadata
    });

    const updatedTemplate = await NotificationTemplate.findByPk(template.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating notification template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification template (HR only)
const deleteNotificationTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Soft delete by marking as inactive
    await template.update({ isActive: false });
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team followups (manager/supervisor)
const getTeamFollowups = async (req, res) => {
  try {
    const { department, status } = req.query;
    const where = {
      type: "team_followup",
      isRead: false,
    };

    // If user is a supervisor, get their team's followups
    if (req.user.role === 'supervisor') {
      const teamMembers = await User.findAll({
        where: { supervisorId: req.user.id },
        attributes: ['id']
      });
      const teamMemberIds = teamMembers.map(member => member.id);
      where.userId = { [Op.in]: [...teamMemberIds, req.user.id] };
    }

    // If user is a manager, get department followups
    if (req.user.role === 'manager' && department) {
      where.metadata = { department };
    }

    if (status) {
      where.metadata = { ...where.metadata, status };
    }

    const followups = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(followups);
  } catch (error) {
    console.error("Error fetching team followups:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get probation deadlines (manager/HR)
const getProbationDeadlines = async (req, res) => {
  try {
    const { daysUntil = 90, department } = req.query;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + parseInt(daysUntil));

    const where = {
      type: "probation_deadline",
      isRead: false,
      metadata: {
        deadlineDate: {
          [Op.lte]: deadlineDate
        }
      }
    };

    if (department) {
      where.metadata = { ...where.metadata, department };
    }

    // If user is a manager, only show their department
    if (req.user.role === 'manager') {
      where.metadata = { ...where.metadata, department: req.user.department };
    }

    const deadlines = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department", "startDate"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(deadlines);
  } catch (error) {
    console.error("Error fetching probation deadlines:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get system alerts (HR only)
const getSystemAlerts = async (req, res) => {
  try {
    const { severity, category } = req.query;
    const where = {
      type: "system_alert",
      isRead: false,
    };

    if (severity) {
      where.metadata = { ...where.metadata, severity };
    }

    if (category) {
      where.metadata = { ...where.metadata, category };
    }

    const alerts = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching system alerts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get new employees notifications (HR only)
const getNewEmployees = async (req, res) => {
  try {
    const { days = 30, department } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      type: "new_employee",
      isRead: false,
      createdAt: {
        [Op.gte]: startDate
      }
    };

    if (department) {
      where.metadata = { department };
    }

    const newEmployees = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department", "startDate"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(newEmployees);
  } catch (error) {
    console.error("Error fetching new employees notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get onboarding milestones (Manager only)
const getOnboardingMilestones = async (req, res) => {
  try {
    const { department } = req.query;
    const where = {
      type: "onboarding_milestone",
      isRead: false,
    };

    if (department) {
      where.metadata = { department };
    }

    // If user is a manager, only show their department
    if (req.user.role === 'manager') {
      where.metadata = { ...where.metadata, department: req.user.department };
    }

    const milestones = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(milestones);
  } catch (error) {
    console.error("Error fetching onboarding milestones:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending approvals (Manager only)
const getPendingApprovals = async (req, res) => {
  try {
    const { department } = req.query;
    const where = {
      type: "pending_approval",
      isRead: false,
    };

    if (department) {
      where.metadata = { department };
    }

    // If user is a manager, only show their department
    if (req.user.role === 'manager') {
      where.metadata = { ...where.metadata, department: req.user.department };
    }

    const approvals = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(approvals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get summary reports (HR only)
const getSummaryReports = async (req, res) => {
  try {
    const { period, department } = req.query;
    const where = {
      type: "summary_report",
      isRead: false,
    };

    if (period) {
      where.metadata = { ...where.metadata, period };
    }

    if (department) {
      where.metadata = { ...where.metadata, department };
    }

    const reports = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching summary reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback checkpoints (HR only)
const getFeedbackCheckpoints = async (req, res) => {
  try {
    const { checkpoint, department } = req.query;
    const where = {
      type: "feedback_checkpoint",
      isRead: false,
    };

    if (checkpoint) {
      where.metadata = { ...where.metadata, checkpoint };
    }

    if (department) {
      where.metadata = { ...where.metadata, department };
    }

    const checkpoints = await Notification.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "department"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(checkpoints);
  } catch (error) {
    console.error("Error fetching feedback checkpoints:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  getReminders,
  getDocumentNotifications,
  getTrainingNotifications,
  getCoachingSessionNotifications,
  getTeamProgress,
  getOverdueTasks,
  getFeedbackAvailability,
  getFeedbackSubmissions,
  getWeeklyReports,
  getComplianceAlerts,
  getLeaveRequests,
  getTeamFollowups,
  getProbationDeadlines,
  getSystemAlerts,
  getNewEmployees,
  getOnboardingMilestones,
  getPendingApprovals,
  getSummaryReports,
  getFeedbackCheckpoints,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationTemplates,
  createNotificationTemplate,
  getNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
};
