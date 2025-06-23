const {
  User,
  Training,
  Feedback,
  Program,
  Evaluation,
  CoachingSession,
  SurveyResponse,
  Department,
  sequelize
} = require("../models");

const ChecklistProgress = require("../models/ChecklistProgress");
const { Op } = require("sequelize");

console.log("Training:", Training);
console.log("Feedback:", Feedback);
console.log("Evaluation:", Evaluation);
console.log("CoachingSession:", CoachingSession);
console.log("SurveyResponse:", SurveyResponse);

const getPersonalDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info with department
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "department", "startDate"],
      include: [{
        model: Department,
        as: 'departmentInfo',
        attributes: ['name']
      }]
    });
    console.log("ChecklistProgress keys:", Object.keys(ChecklistProgress));
console.log("ChecklistProgress findAll:", typeof ChecklistProgress.findAll);
    // Get checklist completion
    const checklistStats = await ChecklistProgress.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN isCompleted = true THEN 1 ELSE 0 END")), 'completed']
      ],
      raw: true
    });
    console.log("checklistStats:", checklistStats);

    // Get recent feedback
    const recentFeedback = await Feedback.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['name', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['name', 'role']
        }
      ]
    });

    // Get program progress if user is in a program
    const programProgress = await Program.findOne({
      where: { createdBy: userId },
      attributes: ['title', 'status', 'programType', 'createdAt', 'updatedAt']
    });

    // Get recent evaluations
    const recentEvaluations = await Evaluation.findAll({
      where: { employeeId: userId },
      limit: 3,
      order: [['createdAt', 'DESC']],
      attributes: ['type', 'status', 'createdAt']
    });

    // Get upcoming coaching sessions
    const upcomingCoaching = await CoachingSession.findAll({
      where: {
        employeeId: userId,
        scheduledFor: {
          [Op.gte]: new Date()
        }
      },
      limit: 3,
      order: [['scheduledFor', 'ASC']],
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['name']
      }]
    });

    // Get survey participation
    const surveyStats = await SurveyResponse.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalResponses']
      ]
    });

    // Compile dashboard data
    const dashboardData = {
      userInfo: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentInfo?.name,
        startDate: user.startDate
      },
      checklistProgress: {
        total: checklistStats?.total || 0,
        completed: checklistStats?.completed || 0,
        completionRate: checklistStats?.total > 0 
          ? (checklistStats.completed / checklistStats.total) * 100 
          : 0
      },
      programStatus: programProgress ? {
        title: programProgress.title,
        status: programProgress.status,
        programType: programProgress.programType,
        timeframe: {
          start: programProgress.createdAt,
          end: programProgress.updatedAt
        }
      } : null,
      recentActivity: {
        feedback: recentFeedback.map(f => ({
          type: f.type,
          date: f.createdAt,
          from: f.sender.name,
          to: f.receiver.name,
          status: f.status
        })),
        evaluations: recentEvaluations.map(e => ({
          type: e.type,
          status: e.status,
          date: e.createdAt
        }))
      },
      upcomingCoaching: upcomingCoaching.map(session => ({
        date: session.scheduledFor,
        supervisor: session.supervisor.name,
        status: session.status
      })),
      surveyParticipation: {
        totalResponses: surveyStats[0]?.totalResponses || 0
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching personal dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Checklist analytics only
const getPersonalChecklistAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const checklistStats = await ChecklistProgress.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN isCompleted = true THEN 1 ELSE 0 END")), 'completed']
      ],
      raw: true
    });
    res.json({
      total: checklistStats?.total || 0,
      completed: checklistStats?.completed || 0,
      completionRate: checklistStats?.total > 0
        ? (checklistStats.completed / checklistStats.total) * 100
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Feedback analytics only
const getPersonalFeedbackAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const recentFeedback = await Feedback.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['name', 'role'] },
        { model: User, as: 'receiver', attributes: ['name', 'role'] }
      ]
    });
    res.json({
      feedback: recentFeedback.map(f => ({
        type: f.type,
        date: f.createdAt,
        from: f.sender?.name,
        to: f.receiver?.name,
        status: f.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Onboarding analytics only (program info)
const getPersonalOnboardingAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const programProgress = await Program.findOne({
      where: { createdBy: userId },
      attributes: ['title', 'status', 'programType', 'createdAt', 'updatedAt']
    });
    res.json(programProgress || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Training analytics only (count of trainings, if you have a model later)
const getPersonalTrainingAnalytics = async (req, res) => {
  try {
    // Placeholder: return empty or static data since you have no Training model
    res.json({ message: 'No training analytics available.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPersonalDashboard,
  getPersonalChecklistAnalytics,
  getPersonalFeedbackAnalytics,
  getPersonalOnboardingAnalytics,
  getPersonalTrainingAnalytics
}; 