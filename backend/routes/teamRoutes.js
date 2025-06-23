const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { auth } = require("../middleware/auth");

// @route   GET /api/team
// @desc    Get team members
// @access  Private
router.get("/", auth, teamController.getTeamMembers);

// @route   GET /api/team/feedback
// @desc    Get team feedback
// @access  Private
router.get("/feedback", auth, teamController.getTeamFeedback);

// @route   GET /api/team/feedback/analytics
// @desc    Get team feedback analytics
// @access  Private
router.get("/feedback/analytics", auth, teamController.getTeamFeedbackAnalytics);

// @route   GET /api/teams/settings
// @desc    Get team settings
// @access  Private (Supervisor, HR, Admin)
router.get("/settings", auth, teamController.getTeamSettings);

// @route   PUT /api/teams/settings
// @desc    Update team settings
// @access  Private (Supervisor, HR, Admin)
router.put("/settings", auth, teamController.updateTeamSettings);

// @route   GET /api/team/:id
// @desc    Get team by ID
// @access  Private
router.get("/:id", auth, teamController.getTeamById);

// @route   POST /api/team
// @desc    Create new team
// @access  Private (HR/Admin)
router.post("/", auth, teamController.createTeam);

// @route   PUT /api/team/:id
// @desc    Update team
// @access  Private (HR/Admin)
router.put("/:id", auth, teamController.updateTeam);

// @route   DELETE /api/team/:id
// @desc    Delete team
// @access  Private (Admin)
router.delete("/:id", auth, teamController.deleteTeam);

module.exports = router;
