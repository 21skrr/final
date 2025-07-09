const express = require("express");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const models = require("../models");
const { User, Team, Feedback } = require("../models"); // Add model imports

// Get team feedback (Supervisor endpoint)
const getTeamFeedback = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get team members
    const teamMembers = await User.findAll({
      where: { teamId: user.teamId },
      attributes: ['id']
    });

    if (!teamMembers.length) {
      return res.json([]);
    }

    const teamMemberIds = teamMembers.map(member => member.id);

    // Get feedback that is shared with supervisor (toUserId is the supervisor)
    const feedback = await Feedback.findAll({
      where: {
        fromUserId: { [Op.in]: teamMemberIds },
        toUserId: req.user.id // Only feedback sent to this supervisor
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(Array.isArray(feedback) ? feedback : []);
  } catch (error) {
    console.error("Error fetching team feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team feedback analytics
const getTeamFeedbackAnalytics = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get team members
    const teamMembers = await User.findAll({
      where: { teamId: user.teamId },
      attributes: ['id']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    // Get analytics for different time periods
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Get feedback counts by type
    const feedbackByType = await sequelize.query(`
      SELECT type, COUNT(*) as count
      FROM feedback
      WHERE (fromUserId IN (:userIds) OR toUserId IN (:userIds))
      AND createdAt BETWEEN :startDate AND :endDate
      GROUP BY type
    `, {
      replacements: { 
        userIds: teamMemberIds,
        startDate,
        endDate
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Get feedback counts by user
    const feedbackByUser = await sequelize.query(`
      SELECT 
        f.fromUserId,
        f.toUserId,
        COUNT(*) as count,
        s.name as sender_name,
        r.name as receiver_name
      FROM feedback f
      LEFT JOIN users s ON f.fromUserId = s.id
      LEFT JOIN users r ON f.toUserId = r.id
      WHERE (f.fromUserId IN (:userIds) OR f.toUserId IN (:userIds))
      AND f.createdAt BETWEEN :startDate AND :endDate
      GROUP BY f.fromUserId, f.toUserId
    `, {
      replacements: { 
        userIds: teamMemberIds,
        startDate,
        endDate
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Get feedback trend over time
    const feedbackTrend = await sequelize.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM feedback
      WHERE (fromUserId IN (:userIds) OR toUserId IN (:userIds))
      AND createdAt BETWEEN :startDate AND :endDate
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, {
      replacements: { 
        userIds: teamMemberIds,
        startDate,
        endDate
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate overall statistics
    const [{ total }] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM feedback
      WHERE (fromUserId IN (:userIds) OR toUserId IN (:userIds))
      AND createdAt BETWEEN :startDate AND :endDate
    `, {
      replacements: { 
        userIds: teamMemberIds,
        startDate,
        endDate
      },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      overview: {
        totalFeedback: total,
        dateRange: {
          start: startDate,
          end: endDate
        }
      },
      byType: feedbackByType,
      byUser: feedbackByUser.map(item => ({
        fromUserId: item.fromUserId,
        toUserId: item.toUserId,
        count: item.count,
        sender: { name: item.sender_name },
        receiver: { name: item.receiver_name }
      })),
      trend: feedbackTrend
    });

  } catch (error) {
    console.error("Error fetching team feedback analytics:", error);
    res.status(500).json({ 
      message: "Server error",
      details: error.message 
    });
  }
};

// @desc    Get team members
// @route   GET /api/team
// @access  Private
const getTeamMembers = async (req, res) => {
  try {
    const team = await Team.findOne({
      where: { id: req.user.teamId },
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

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get team by ID
// @route   GET /api/team/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
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

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create new team
// @route   POST /api/team
// @access  Private (HR/Admin)
const createTeam = async (req, res) => {
  try {
    const { name, description, department } = req.body;

    const team = await Team.create({
      name,
      description,
      department,
      createdBy: req.user.id,
    });

    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update team
// @route   PUT /api/team/:id
// @access  Private (HR/Admin)
const updateTeam = async (req, res) => {
  try {
    const { name, description, department } = req.body;
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await team.update({
      name: name || team.name,
      description: description || team.description,
      department: department || team.department,
    });

    res.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete team
// @route   DELETE /api/team/:id
// @access  Private (Admin)
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if team has members
    const memberCount = await User.count({ where: { teamId: team.id } });
    if (memberCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete team with active members. Reassign members first.",
      });
    }

    await team.destroy();
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get team settings
// @route   GET /api/teams/settings
// @access  Private (Supervisor, HR, Admin)
const getTeamSettings = async (req, res) => {
  try {
    // Ensure the authenticated user is a supervisor, HR, or Admin
    if (!['supervisor', 'hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Only supervisors, HR, or Admins can view team settings.' });
    }

    // Find the team settings for the user's team
    const teamSettings = await models.TeamSettings.findOne({
      where: { teamId: req.user.teamId },
    });

    if (!teamSettings) {
      // If settings don't exist, create default settings for this team
      const defaultSettings = await models.TeamSettings.create({
        teamId: req.user.teamId,
        // Default values will be applied from the model definition
      });
      return res.json(defaultSettings); // Return the newly created default settings
    }

    res.json(teamSettings);
  } catch (error) {
    console.error("Error fetching team settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update team settings
// @route   PUT /api/teams/settings
// @access  Private (Supervisor, HR, Admin)
const updateTeamSettings = async (req, res) => {
  try {
    // Ensure the authenticated user is a supervisor, HR, or Admin
    if (!['supervisor', 'hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Only supervisors, HR, or Admins can update team settings.' });
    }

    // Find the team settings for the user's team
    let teamSettings = await models.TeamSettings.findOne({
      where: { teamId: req.user.teamId },
    });

    if (!teamSettings) {
      // If settings don't exist, create them first with provided updates
      const updateData = { teamId: req.user.teamId, ...req.body };
      const newSettings = await models.TeamSettings.create(updateData);
      return res.json({ message: "Team settings created and updated successfully.", teamSettings: newSettings });
    }

    // Update allowed fields from request body
    const allowedUpdates = ['reportFilters', 'coachingAlertsEnabled'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        teamSettings[field] = req.body[field];
      }
    });

    await teamSettings.save(); // Save the updated settings

    res.json({ message: "Team settings updated successfully.", teamSettings });
  } catch (error) {
    console.error("Error updating team settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all teams
// @route   GET /api/teams/all
// @access  Private (HR/Admin)
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          as: "Users",
          attributes: ["id", "name", "email", "role", "department", "startDate"],
        },
      ],
    });
    res.json(teams);
  } catch (error) {
    console.error("Error fetching all teams:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTeamMembers,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamFeedback,
  getTeamFeedbackAnalytics,
  getTeamSettings,
  updateTeamSettings,
  getAllTeams,
};
