const { User, Department, Feedback, Evaluation, Team, OnboardingProgress, Task } = require("../models");
const { Op } = require("sequelize");

// Department Dashboard (summary)
const getDepartmentDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const departmentUsers = await User.findAll({ where: { department: user.department } });
    const teams = await Team.findAll({ where: { department: user.department } });
    const roleBreakdown = departmentUsers.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    res.json({
      department: user.department,
      totalUsers: departmentUsers.length,
      roleBreakdown,
      teams: teams.map(t => ({ id: t.id, name: t.name }))
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Onboarding KPIs per team/supervisor
const getDepartmentOnboardingKPI = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teams = await Team.findAll({ where: { department: user.department } });
    const result = await Promise.all(teams.map(async team => {
      const teamUsers = await User.findAll({ where: { teamId: team.id } });
      const userIds = teamUsers.map(u => u.id);
      const stageCounts = await OnboardingProgress.findAll({
        where: { UserId: { [Op.in]: userIds } },
        attributes: [
          'stage',
          [OnboardingProgress.sequelize.fn('COUNT', OnboardingProgress.sequelize.col('id')), 'count']
        ],
        group: ['stage'],
        raw: true
      });
      return {
        team: { id: team.id, name: team.name },
        total: userIds.length,
        byStage: stageCounts
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Probation milestone tracking and task adherence
const getDepartmentProbation = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const departmentUsers = await User.findAll({ where: { department: user.department } });
    const userIds = departmentUsers.map(u => u.id);
    // Users in probation: onboarding stage not 'excel' or status not 'completed'
    const probation = await OnboardingProgress.findAll({
      where: {
        UserId: { [Op.in]: userIds },
        [Op.or]: [
          { stage: { [Op.ne]: 'excel' } },
          { status: { [Op.ne]: 'completed' } }
        ]
      },
      raw: true
    });
    // Task adherence: % completed tasks per user
    const adherence = await Promise.all(departmentUsers.map(async u => {
      const tasks = await Task.findAll({ where: { userId: u.id } });
      const completed = tasks.filter(t => t.isCompleted).length;
      return {
        userId: u.id,
        name: u.name,
        totalTasks: tasks.length,
        completedTasks: completed,
        adherence: tasks.length > 0 ? (completed / tasks.length) * 100 : 0
      };
    }));
    res.json({ probation, adherence });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Evaluation results comparison across teams
const getDepartmentEvaluations = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teams = await Team.findAll({ where: { department: user.department } });
    const result = await Promise.all(teams.map(async team => {
      const teamUsers = await User.findAll({ where: { teamId: team.id } });
      const userIds = teamUsers.map(u => u.id);
      const evalCounts = await Evaluation.findAll({
        where: { employeeId: { [Op.in]: userIds } },
        attributes: [
          'status',
          [Evaluation.sequelize.fn('COUNT', Evaluation.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });
      return {
        team: { id: team.id, name: team.name },
        byStatus: evalCounts
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Feedback and satisfaction trends
const getDepartmentFeedback = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const teams = await Team.findAll({ where: { department: user.department } });
    const result = await Promise.all(teams.map(async team => {
      const teamUsers = await User.findAll({ where: { teamId: team.id } });
      const userIds = teamUsers.map(u => u.id);
      const feedbackCounts = await Feedback.findAll({
        where: {
          [Op.or]: [
            { fromUserId: { [Op.in]: userIds } },
            { toUserId: { [Op.in]: userIds } }
          ]
        },
        attributes: [
          'type',
          'priority',
          [Feedback.sequelize.fn('COUNT', Feedback.sequelize.col('id')), 'count']
        ],
        group: ['type', 'priority'],
        raw: true
      });
      return {
        team: { id: team.id, name: team.name },
        feedback: feedbackCounts
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDepartmentDashboard,
  getDepartmentOnboardingKPI,
  getDepartmentProbation,
  getDepartmentEvaluations,
  getDepartmentFeedback
}; 