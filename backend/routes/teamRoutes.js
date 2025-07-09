const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { auth, checkRole } = require("../middleware/auth");

// @route   GET /api/teams
// @desc    Get all teams (any authenticated user)
// @access  Private
router.get("/", auth, teamController.getAllTeams);

// @route   GET /api/team/feedback
// @desc    Get team feedback (Supervisor only)
// @access  Private (Supervisor)
router.get("/feedback", auth, checkRole("supervisor"), teamController.getTeamFeedback);

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

// @route   GET /api/teams/all
// @desc    Get all teams (HR/Admin)
// @access  Private (HR/Admin)
router.get("/all", auth, checkRole("hr", "admin"), teamController.getAllTeams);

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
