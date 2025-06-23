const { User, Team, Feedback, ChecklistProgress, CoachingSession } = require("../models");
const { Op } = require("sequelize");

// Team Dashboard (summary)
const getTeamDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teamMembers = await User.findAll({ where: { teamId: user.teamId } });
    res.json({
      totalMembers: teamMembers.length,
      members: teamMembers.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role }))
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Checklist progress per employee
const getTeamChecklistProgress = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teamMembers = await User.findAll({ where: { teamId: user.teamId } });
    const progress = await Promise.all(teamMembers.map(async member => {
      const stats = await ChecklistProgress.findOne({
        where: { userId: member.id },
        attributes: [
          [ChecklistProgress.sequelize.fn('COUNT', ChecklistProgress.sequelize.col('id')), 'total'],
          [ChecklistProgress.sequelize.fn('SUM', ChecklistProgress.sequelize.literal("CASE WHEN isCompleted = true THEN 1 ELSE 0 END")), 'completed']
        ],
        raw: true
      });
      return {
        userId: member.id,
        name: member.name,
        total: stats?.total || 0,
        completed: stats?.completed || 0,
        completionRate: stats?.total > 0 ? (stats.completed / stats.total) * 100 : 0
      };
    }));
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Training participation and completion (placeholder)
const getTeamTrainingAnalytics = async (req, res) => {
  try {
    res.json({ message: "No training analytics available." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Feedback trends (non-anonymous)
const getTeamFeedbackAnalytics = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teamMembers = await User.findAll({ where: { teamId: user.teamId }, attributes: ['id'] });
    const teamMemberIds = teamMembers.map(m => m.id);
    const feedback = await Feedback.findAll({
      where: {
        isAnonymous: false,
        [Op.or]: [
          { fromUserId: { [Op.in]: teamMemberIds } },
          { toUserId: { [Op.in]: teamMemberIds } }
        ]
      },
      order: [['createdAt', 'DESC']]
    });
    res.json({ count: feedback.length, feedback });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Coaching session tracking and notes
const getTeamCoachingAnalytics = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teamMembers = await User.findAll({ where: { teamId: user.teamId }, attributes: ['id', 'name'] });
    const teamMemberIds = teamMembers.map(m => m.id);
    const sessions = await CoachingSession.findAll({
      where: { employeeId: { [Op.in]: teamMemberIds } },
      order: [['scheduledFor', 'DESC']]
    });
    res.json({ count: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTeamDashboard,
  getTeamChecklistProgress,
  getTeamTrainingAnalytics,
  getTeamFeedbackAnalytics,
  getTeamCoachingAnalytics
}; 