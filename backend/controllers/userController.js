const express = require("express");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");
const models = require("../models");
const { User, UserSetting, TeamSettings } = require("../models");
const scheduleFeedbackCyclesForUser = require("../utils/autoScheduleFeedback");
const Department = require("../models/Department");

// Get all users (admin, hr, and supervisor for assessment purposes)
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const whereClause = {
      deletedAt: null // Only show non-deleted users
    };

    // Add role-based filtering
    if (role) {
      whereClause.role = role;
    }

    // For supervisors, allow them to see all employees
    if (req.user.role === "supervisor") {
      whereClause.role = "employee";
      // No department filtering - show all employees
    }

    // For managers, allow them to see employees and supervisors in their department
    if (req.user.role === "manager") {
      whereClause.role = { [Op.in]: ["employee", "supervisor"] };
      // Optionally filter by department if manager has department info
      if (req.user.department) {
        whereClause.department = req.user.department;
      }
    }

    console.log("User role:", req.user.role);
    console.log("User department:", req.user.department);
    console.log("Where clause:", whereClause);
    
    // First, let's check all employees without any filters
    const allEmployees = await User.findAll({
      where: { role: "employee" },
      attributes: ["id", "name", "email", "deletedAt"],
      order: [["createdAt", "DESC"]],
    });
    
    console.log("All employees in database:", allEmployees.length);
    console.log("All employee names:", allEmployees.map(u => u.name));
    console.log("Employees with deletedAt:", allEmployees.filter(u => u.deletedAt).map(u => ({ name: u.name, deletedAt: u.deletedAt })));
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ["passwordHash"] },
      order: [["createdAt", "DESC"]],
    });
    
    console.log("Found users after filtering:", users.length);
    console.log("User names after filtering:", users.map(u => u.name));
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get deactivated users (admin only)
const getDeactivatedUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const whereClause = {
      deletedAt: { [Op.not]: null } // Only show deleted users
    };

    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ["passwordHash"] },
      order: [["deletedAt", "DESC"]],
      paranoid: false, // Ensure soft-deleted users are included
    });
    console.log("Deactivated users found:", users.length, users.map(u => u.id));
    res.json(users);
  } catch (error) {
    console.error("Error fetching deactivated users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["passwordHash"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has permission to view this user
    if (
      req.user.role !== "admin" &&
      req.user.role !== "hr" &&
      req.user.role !== "supervisor" &&
      req.user.id !== req.params.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this user" });
    }

    // For supervisors, only allow access to employees
    if (req.user.role === "supervisor" && user.role !== "employee") {
      return res
        .status(403)
        .json({ message: "Supervisors can only view employee data" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, startDate, programType, supervisorId, teamId } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password using SHA256
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      department,
      startDate,
      programType,
      supervisorId: role === 'employee' ? supervisorId : null,
      teamId: role === 'employee' ? teamId : null,
    });
    try {
    await scheduleFeedbackCyclesForUser(user);
    } catch (err) {
      console.error('Error scheduling feedback cycles:', err);
      // Optionally: return res.status(500).json({ message: 'Error scheduling feedback cycles' });
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has permission to update this user
    if (
      req.user.role !== "admin" &&
      req.user.role !== "hr" &&
      req.user.id !== req.params.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this user" });
    }

    const { name, email, password, role, department, startDate, programType, supervisorId, teamId } =
      req.body;

    // Update user
    const updateData = {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      department: department || user.department,
      startDate: startDate || user.startDate,
      programType: programType || user.programType,
    };

    // Only update supervisorId and teamId if provided and user is an employee
    if (supervisorId !== undefined) {
      updateData.supervisorId = supervisorId;
    }
    if (teamId !== undefined) {
      updateData.teamId = teamId;
    }

    // Only update password if provided
    if (password) {
      // Use SHA256 for password hashing to be consistent
      updateData.passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    }

    await user.update(updateData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    console.log('Attempting to deactivate user with ID:', req.params.id);
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      console.log('User not found for ID:', req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Found user:', user.name, 'Current deletedAt:', user.deletedAt);
    
    // Use Sequelize's destroy() method for soft delete (since paranoid: true)
    await user.destroy();
    
    // Verify the soft delete worked
    const deletedUser = await User.findByPk(req.params.id, { paranoid: false });
    console.log('User after destroy - deletedAt:', deletedUser?.deletedAt);
    
    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restore user (soft delete)
const restoreUser = async (req, res) => {
  try {
    console.log('Attempting to restore user with ID:', req.params.id);
    
    // Find the user including soft deleted ones
    const user = await User.findByPk(req.params.id, { paranoid: false });
    if (!user) {
      console.log('User not found for ID:', req.params.id);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log('Found user:', user.name, 'Current deletedAt:', user.deletedAt);
    
    // Use Sequelize's restore() method
    await user.restore();
    
    // Verify the restore worked
    const restoredUser = await User.findByPk(req.params.id);
    console.log('User after restore - deletedAt:', restoredUser?.deletedAt);
    
    res.json({ message: "User restored successfully" });
  } catch (error) {
    console.error("Error restoring user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team members (supervisor/manager only)
const getTeamMembers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { 
        supervisorId: req.user.id,
        deletedAt: null // Only show non-deleted users
      },
      attributes: { exclude: ["passwordHash"] },
      order: [["name", "ASC"]],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user settings by userId
const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Authorization check
    if (requestingUser.id !== userId && !['admin', 'hr'].includes(requestingUser.role)) {
      return res.status(403).json({ message: "Forbidden: You are not authorized to view these settings." });
    }

    let userSettings = await models.UserSetting.findOne({
      where: { userId },
      include: [{ model: models.User, as: 'User', attributes: ['id', 'name', 'email'] }],
    });

    if (!userSettings) {
      // Create default settings if they don't exist for this user
      userSettings = await models.UserSetting.create({
        userId,
      });
    }

    res.json(userSettings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user settings by userId
const updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Authorization check
    if (requestingUser.id !== userId && !['admin', 'hr'].includes(requestingUser.role)) {
      return res.status(403).json({ message: "Forbidden: You are not authorized to update these settings." });
    }

    let userSettings = await models.UserSetting.findOne({
      where: { userId },
    });

    const updateData = { ...req.body };

    if (!userSettings) {
      // If settings don't exist, create them with the provided updates
      userSettings = await models.UserSetting.create({ userId, ...updateData });
      return res.json({ message: "User settings created successfully.", userSettings });
    }

    // Otherwise, update existing settings
    await userSettings.update(updateData);
    res.json({ message: "User settings updated successfully.", userSettings });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Manager Preferences
const getManagerPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Authorization check - only the manager themselves, HR, or admin can view preferences
    if (requestingUser.id !== userId && !['admin', 'hr'].includes(requestingUser.role)) {
      return res.status(403).json({ message: "Forbidden: You are not authorized to view these preferences." });
    }

    const manager = await User.findByPk(userId);

    if (!manager || !manager.teamId) {
      return res.status(404).json({ message: "Manager or team not found." });
    }

    // Fetch user-specific settings
    const userSettings = await UserSetting.findOne({
      where: { userId },
      attributes: ['notificationFrequency', 'dashboardLayout'],
    }) || {};

    // Fetch team-specific settings
    const teamSettings = await TeamSettings.findOne({
      where: { teamId: manager.teamId },
      attributes: ['teamVisibility'],
    }) || {};

    const preferences = {
      notificationFrequency: userSettings.notificationFrequency || 'daily',
      dashboardLayout: userSettings.dashboardLayout || 'detailed',
      teamVisibility: teamSettings.teamVisibility || 'direct_reports',
    };

    res.json(preferences);
  } catch (error) {
    console.error("Error fetching manager preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Manager Preferences
const updateManagerPreferences = async (req, res) => {
  const { userId } = req.params;
  const requestingUser = req.user;
  const { notificationFrequency, dashboardLayout, teamVisibility } = req.body;
  const t = await models.sequelize.transaction();

  try {
    // Authorization check - only the manager themselves, HR, or admin can update preferences
    if (requestingUser.id !== userId && !['admin', 'hr'].includes(requestingUser.role)) {
      await t.rollback();
      return res.status(403).json({ message: "Forbidden: You are not authorized to update these preferences." });
    }

    const manager = await User.findByPk(userId);
    if (!manager || !manager.teamId) {
      await t.rollback();
      return res.status(404).json({ message: "Manager or team not found." });
    }

    const userSettingsData = {};
    if (notificationFrequency) userSettingsData.notificationFrequency = notificationFrequency;
    if (dashboardLayout) userSettingsData.dashboardLayout = dashboardLayout;

    if (Object.keys(userSettingsData).length > 0) {
      await UserSetting.upsert({ userId, ...userSettingsData }, { transaction: t });
    }

    const teamSettingsData = {};
    if (teamVisibility) teamSettingsData.teamVisibility = teamVisibility;

    if (Object.keys(teamSettingsData).length > 0) {
      await TeamSettings.upsert({ teamId: manager.teamId, ...teamSettingsData }, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Preferences updated successfully." });
  } catch (error) {
    await t.rollback();
    console.error("Error updating manager preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Manager Preferences for current user (me)
const getManagerPreferencesMe = async (req, res) => {
  try {
    console.log("getManagerPreferencesMe called with user:", req.user.id);
    const managerId = req.user.id;
    const manager = await User.findByPk(managerId);

    console.log("Manager found:", manager ? manager.id : "not found");
    console.log("Manager teamId:", manager ? manager.teamId : "no team");

    if (!manager || !manager.teamId) {
      return res.status(404).json({ message: "Manager or team not found." });
    }

    // Fetch user-specific settings
    const userSettings = await UserSetting.findOne({
      where: { userId: managerId },
      attributes: ['notificationFrequency', 'dashboardLayout'],
    }) || {};

    console.log("User settings found:", userSettings);

    // Fetch team-specific settings
    const teamSettings = await TeamSettings.findOne({
      where: { teamId: manager.teamId },
      attributes: ['teamVisibility'],
    }) || {};

    console.log("Team settings found:", teamSettings);

    const preferences = {
      notificationFrequency: userSettings.notificationFrequency || 'daily',
      dashboardLayout: userSettings.dashboardLayout || 'detailed',
      teamVisibility: teamSettings.teamVisibility || 'direct_reports',
    };

    console.log("Returning preferences:", preferences);
    res.json(preferences);
  } catch (error) {
    console.error("Error in getManagerPreferencesMe:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Manager Preferences for current user (me)
const updateManagerPreferencesMe = async (req, res) => {
  const managerId = req.user.id;
  const { notificationFrequency, dashboardLayout, teamVisibility } = req.body;
  const t = await models.sequelize.transaction();

  try {
    const manager = await User.findByPk(managerId);
    if (!manager || !manager.teamId) {
      await t.rollback();
      return res.status(404).json({ message: "Manager or team not found." });
    }

    const userSettingsData = {};
    if (notificationFrequency) userSettingsData.notificationFrequency = notificationFrequency;
    if (dashboardLayout) userSettingsData.dashboardLayout = dashboardLayout;

    if (Object.keys(userSettingsData).length > 0) {
      await UserSetting.upsert({ userId: managerId, ...userSettingsData }, { transaction: t });
    }

    const teamSettingsData = {};
    if (teamVisibility) teamSettingsData.teamVisibility = teamVisibility;

    if (Object.keys(teamSettingsData).length > 0) {
      await TeamSettings.upsert({ teamId: manager.teamId, ...teamSettingsData }, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Preferences updated successfully." });
  } catch (error) {
    await t.rollback();
    console.error("Error updating manager preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get users who have not been added to any onboarding program
const getUsersWithoutOnboarding = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: 'employee' // or whatever role should have onboarding
      },
      include: [{
        model: OnboardingProgress,
        required: false
      }],
      having: sequelize.literal('COUNT(OnboardingProgresses.id) = 0'),
      group: ['User.id']
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users without onboarding:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({ attributes: ["id", "name"] });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getDeactivatedUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  getTeamMembers,
  getUserSettings,
  updateUserSettings,
  getManagerPreferences,
  updateManagerPreferences,
  getManagerPreferencesMe,
  updateManagerPreferencesMe,
  getAllDepartments,
};
