const { User } = require("../models");

// Enhanced role-based middleware with onboarding-specific permissions
module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    next();
  };
};

// Onboarding-specific middleware for different user roles
const onboardingPermissions = {
  // Employee can only access their own data
  employee: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: "Employee access only" });
    }

    // For employee routes, ensure they can only access their own data
    const targetUserId = req.params.userId || req.params.id;
    if (targetUserId && targetUserId !== req.user.id) {
      return res.status(403).json({ message: "Employees can only access their own data" });
    }

    next();
  },

  // Supervisor can access their direct reports
  supervisor: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Supervisor access only" });
    }

    // For supervisor routes, check if they're accessing their direct reports
    const targetUserId = req.params.userId || req.params.id;
    if (targetUserId && targetUserId !== req.user.id) {
      try {
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser || targetUser.supervisorId !== req.user.id) {
          return res.status(403).json({ message: "Supervisors can only access their direct reports" });
        }
      } catch (error) {
        return res.status(500).json({ message: "Error validating access" });
      }
    }

    next();
  },

  // Manager can access department data (read-only)
  manager: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: "Manager access only" });
    }

    // Managers have read-only access to onboarding data
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return res.status(403).json({ message: "Managers have read-only access to onboarding data" });
    }

    next();
  },

  // HR has full access
  hr: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: "HR access only" });
    }

    next();
  },

  // Check if user can edit tasks
  canEditTasks: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Only HR and supervisors can edit tasks
    if (!['hr', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: "Task editing not allowed for this role" });
    }

    // For supervisors, check if they're editing their direct report's tasks
    if (req.user.role === 'supervisor') {
      const targetUserId = req.params.userId || req.params.id;
      if (targetUserId && targetUserId !== req.user.id) {
        try {
          const targetUser = await User.findByPk(targetUserId);
          if (!targetUser || targetUser.supervisorId !== req.user.id) {
            return res.status(403).json({ message: "Supervisors can only edit their direct reports' tasks" });
          }
        } catch (error) {
          return res.status(500).json({ message: "Error validating access" });
        }
      }
    }

    next();
  },

  // Check if user can validate tasks (HR only)
  canValidateTasks: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: "Only HR can validate tasks" });
    }

    next();
  },

  // Check if user can advance phases
  canAdvancePhases: async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Only HR and supervisors can advance phases
    if (!['hr', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: "Phase advancement not allowed for this role" });
    }

    // For supervisors, check if they're advancing their direct report's phase
    if (req.user.role === 'supervisor') {
      const targetUserId = req.params.userId || req.params.id;
      if (targetUserId && targetUserId !== req.user.id) {
        try {
          const targetUser = await User.findByPk(targetUserId);
          if (!targetUser || targetUser.supervisorId !== req.user.id) {
            return res.status(403).json({ message: "Supervisors can only advance their direct reports' phases" });
          }
        } catch (error) {
          return res.status(500).json({ message: "Error validating access" });
        }
      }
    }

    next();
  }
};

module.exports.onboardingPermissions = onboardingPermissions;
