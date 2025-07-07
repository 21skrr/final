const {
  User,
  Program,
  Survey,
  SurveyResponse,
  Training,
  Evaluation,
  Feedback,
  Department,
  sequelize,
  analytics_metrics,
  analytics_dashboards,
  Team,
  OnboardingProgress,
  Task,
  Course,
  UserCourse,
  CoachingSession,
  EvaluationCriteria,
  SurveyQuestion,
  SurveyQuestionResponse,
  ChecklistProgress
} = require("../models");
const { Op } = require("sequelize");

// Organization-wide analytics dashboard
const getOrganizationDashboard = async (req, res) => {
  try {
    // Get overall statistics
    const totalUsers = await User.count();
    const departments = await Department.findAll();
    const totalTeams = await Team.count();
    
    // Get role distribution
    const roleBreakdown = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    // Get department-wise user count
    const departmentStats = await User.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    res.json({
      totalUsers,
      totalTeams,
      departments: departments.length,
      roleBreakdown,
      departmentStats
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Completion rates by department/program
const getCompletionRates = async (req, res) => {
  try {
    const result = await User.findAll({
      attributes: [
        'department',
        'programType',
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'totalEmployees'],
        [sequelize.literal('COUNT(DISTINCT CASE WHEN userCourses.progress = 100 OR userCourses.completedAt IS NOT NULL THEN User.id ELSE NULL END)'), 'employeesWithCompletedRequiredCourse']
      ],
      where: { role: 'employee' },
      include: [{
        model: UserCourse,
        as: 'userCourses',
        attributes: [],
        required: false,
        include: [{
          model: Course,
          as: 'course',
          attributes: [],
          where: { isRequired: true },
          required: false
        }]
      }],
      group: ['department', 'programType'],
      raw: true
    });

    const formattedResult = result.map(item => ({
      department: item.department,
      programType: item.programType,
      totalEmployees: item.totalEmployees,
      employeesWithCompletedRequiredCourse: item.employeesWithCompletedRequiredCourse,
      completionRate: item.totalEmployees > 0 ? (item.employeesWithCompletedRequiredCourse / item.totalEmployees) * 100 : 0
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching completion rates:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Feedback participation at 3, 6, 12 months
const getFeedbackParticipation = async (req, res) => {
  try {
    const result = await User.findAll({
      attributes: [
        'department',
        'programType',
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'totalEmployees'],
        // Check for feedback sent or received within the last 3 months using SUM and EXISTS
        [sequelize.literal('SUM(CASE WHEN EXISTS (SELECT 1 FROM Feedback WHERE (Feedback.fromUserId = User.id OR Feedback.toUserId = User.id) AND Feedback.createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) THEN 1 ELSE 0 END)'), 'feedbackParticipants3Months'],
        // Check for feedback sent or received within the last 6 months using SUM and EXISTS
        [sequelize.literal('SUM(CASE WHEN EXISTS (SELECT 1 FROM Feedback WHERE (Feedback.fromUserId = User.id OR Feedback.toUserId = User.id) AND Feedback.createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)) THEN 1 ELSE 0 END)'), 'feedbackParticipants6Months'],
        // Check for feedback sent or received within the last 12 months using SUM and EXISTS
        [sequelize.literal('SUM(CASE WHEN EXISTS (SELECT 1 FROM Feedback WHERE (Feedback.fromUserId = User.id OR Feedback.toUserId = User.id) AND Feedback.createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)) THEN 1 ELSE 0 END)'), 'feedbackParticipants12Months']
      ],
      where: { role: 'employee' },
      group: ['department', 'programType'],
      raw: true
    });

    const formattedResult = result.map(item => ({
      department: item.department,
      programType: item.programType,
      totalEmployees: item.totalEmployees,
      feedbackParticipation: {
        threeMonths: {
          participants: item.feedbackParticipants3Months,
          rate: item.totalEmployees > 0 ? (item.feedbackParticipants3Months / item.totalEmployees) * 100 : 0
        },
        sixMonths: {
          participants: item.feedbackParticipants6Months,
          rate: item.totalEmployees > 0 ? (item.feedbackParticipants6Months / item.totalEmployees) * 100 : 0
        },
        twelveMonths: {
          participants: item.feedbackParticipants12Months,
          rate: item.totalEmployees > 0 ? (item.feedbackParticipants12Months / item.totalEmployees) * 100 : 0
        }
      }
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching feedback participation:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Survey response quality and trends
const getSurveyTrends = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      attributes: [
        'id',
        'title',
        'type',
        'status',
        'createdAt',
        'dueDate',
      ],
      include: [{
        model: SurveyResponse,
        as: 'responses', // Use the correct alias
        attributes: [], // No need to select attributes from SurveyResponse directly
      }],
      group: ['Survey.id'], // Group by survey to count responses per survey
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('responses.id')), 'totalResponses'],
        ]
      }
    });

    // Fetch average rating separately for each survey
    const surveysWithAvgRating = await Promise.all(surveys.map(async (survey) => {
      const avgRatingResult = await SurveyQuestionResponse.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('ratingValue')), 'averageRating']
        ],
        include: [{
          model: SurveyResponse,
          as: 'surveyResponse',
          where: { surveyId: survey.id },
          attributes: [],
        }, {
          model: SurveyQuestion,
          as: 'question',
          where: { type: 'rating' },
          attributes: [],
        }],
        where: { ratingValue: { [Op.ne]: null } },
        group: ['surveyResponse.surveyId']
      });

      return {
        ...survey.toJSON(),
        averageRating: avgRatingResult ? avgRatingResult.getDataValue('averageRating') : null,
      };
    }));

    res.json(surveysWithAvgRating);
  } catch (error) {
    console.error('Error fetching survey trends:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Training completion vs. role expectations
const getTrainingCompletion = async (req, res) => {
  try {
    const result = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'totalEmployees'],
        // Count users with completed required courses using a subquery/literal join
        [sequelize.literal('COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM UserCourses AS uc JOIN Courses AS c ON uc.courseId = c.id WHERE uc.userId = User.id AND c.isRequired = TRUE AND (uc.progress = 100 OR uc.completedAt IS NOT NULL)) THEN User.id ELSE NULL END)'), 'employeesWithCompletedRequiredTraining']
      ],
      where: { role: { [Op.ne]: null } }, // Consider users with a defined role
      // Removed includes
      group: ['role'],
      raw: true
    });

    const formattedResult = result.map(item => ({
      role: item.role,
      totalEmployees: item.totalEmployees,
      employeesWithCompletedRequiredTraining: item.employeesWithCompletedRequiredTraining,
      completionRate: item.totalEmployees > 0 ? (item.employeesWithCompletedRequiredTraining / item.totalEmployees) * 100 : 0
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching training completion:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Evaluation and coaching effectiveness
const getEvaluationEffectiveness = async (req, res) => {
  try {
    // Simplified query to troubleshoot includes
    const evaluationResults = await User.findAll({
      attributes: [
        'department',
        'programType',
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'totalEmployees'],
        [sequelize.literal('COUNT(DISTINCT CASE WHEN employeeEvaluations.status = "completed" THEN User.id ELSE NULL END)'), 'employeesWithCompletedEvaluation']
      ],
      where: { role: 'employee' },
      include: [{
        model: Evaluation,
        as: 'employeeEvaluations', // Use the alias defined in models/index.js
        attributes: [],
        required: false
        // Temporarily removed nested include for EvaluationCriteria
      }],
      group: ['department', 'programType'],
      raw: true
    });

    const coachingResults = await User.findAll({
      attributes: [
        'department',
        'programType',
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'totalEmployees'],
        [sequelize.literal('COUNT(DISTINCT CASE WHEN employeeSessions.status = "completed" THEN User.id ELSE NULL END)'), 'employeesWithCompletedCoachingSession']
      ],
      where: { role: 'employee' },
      include: [{
        model: CoachingSession,
        as: 'employeeSessions', // Use the alias defined in models/index.js
        attributes: [],
        required: false
      }],
      group: ['department', 'programType'],
      raw: true
    });

    // Combine results
    const combinedResults = evaluationResults.map(evalItem => {
      const coachingItem = coachingResults.find(coachItem => 
        coachItem.department === evalItem.department && 
        coachItem.programType === evalItem.programType
      ) || { employeesWithCompletedCoachingSession: 0 };

      // Placeholder for average rating since EvaluationCriteria is removed
      const averageEvaluationRating = 'N/A'; // Or calculate separately later

      return {
        department: evalItem.department,
        programType: evalItem.programType,
        totalEmployees: evalItem.totalEmployees,
        evaluation: {
          averageRating: averageEvaluationRating,
          employeesWithCompletedEvaluation: evalItem.employeesWithCompletedEvaluation
        },
        coaching: {
          employeesWithCompletedCoachingSession: coachingItem.employeesWithCompletedCoachingSession
        }
      };
    });

    res.json(combinedResults);
  } catch (error) {
    console.error('Error fetching evaluation effectiveness:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get detailed user-level analytics
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const requestingUser = req.user; // Assuming user info is attached to req.user by auth middleware

    // Authorization check: Only allow HR to view other users' analytics
    if (requestingUser.role !== 'hr' && requestingUser.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this user\'s analytics' });
    }

    // Get user info with department and team
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "department", "startDate", "programType"],
      include: [{
        model: Department,
        as: 'departmentInfo',
        attributes: ['name']
      }, {
        model: Team,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get checklist completion
    const checklistStats = await ChecklistProgress.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN isCompleted = true THEN 1 ELSE 0 END")), 'completed']
      ],
      raw: true
    });

    // Get feedback (sent and received)
    const feedback = await Feedback.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['name', 'role'] },
        { model: User, as: 'receiver', attributes: ['name', 'role'] }
      ]
    });

    // Get program progress (if applicable - assuming user is linked to program via programType or similar)
    // NOTE: This part might need adjustment based on how users are linked to programs
    const programProgress = await Program.findOne({
       where: { programType: user.programType }, // Should work now that programType is fetched
       attributes: ['title', 'status', 'programType', 'createdAt', 'updatedAt']
     });

    // Get evaluations (as employee)
    const evaluations = await Evaluation.findAll({
      where: { employeeId: userId },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'employeeId',
        'evaluatorId',
        'type',
        'status',
        'completedAt',
        'createdAt',
        'updatedAt',
        'reviewedBy',
      ],
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['name']
      }]
    });

    // Get coaching sessions (as employee)
    const coachingSessions = await CoachingSession.findAll({
      where: { employeeId: userId },
      order: [['scheduledFor', 'ASC']],
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['name']
      }]
    });

    // Get survey responses
    const surveyResponses = await SurveyResponse.findAll({
      where: { userId },
      include: [{
        model: Survey,
        as: 'survey',
        attributes: ['title', 'type']
      }]
    });

    res.json({
      userInfo: user,
      checklistProgress: checklistStats,
      feedback: feedback,
      programStatus: programProgress,
      evaluations: evaluations,
      coachingSessions: coachingSessions,
      surveyResponses: surveyResponses,
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics for a specific program
const getProgramAnalytics = async (req, res) => {
  try {
    const programId = req.params.programId;
    const requestingUser = req.user; // Assuming user info is attached to req.user by auth middleware

    // Authorization check: Only allow HR to view program analytics
    if (requestingUser.role !== 'hr') {
      return res.status(403).json({ message: 'Not authorized to view program analytics' });
    }

    // Find the program
    const program = await Program.findByPk(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Get employees in the program
    const programEmployees = await User.findAll({
      where: { programType: program.programType }, // Assuming users are linked by programType
      attributes: ['id', 'name', 'email', 'department', 'startDate'],
    });

    const employeeIds = programEmployees.map(emp => emp.id);
    const totalProgramEmployees = employeeIds.length;

    // Get relevant surveys for the program type
    const surveys = await Survey.findAll({
      where: { type: program.programType }, // Assuming surveys are linked by programType
      attributes: ['id', 'title', 'type', 'status', 'createdAt', 'dueDate'],
    });

    const surveyIds = surveys.map(survey => survey.id);

    // Fetch survey responses for employees in this program for these surveys
    let surveyResponses = [];
    let questionResponses = [];
    if (employeeIds.length > 0 && surveyIds.length > 0) {
       surveyResponses = await SurveyResponse.findAll({
        where: {
          userId: { [Op.in]: employeeIds },
          surveyId: { [Op.in]: surveyIds }
        },
        attributes: ['id', 'surveyId', 'userId', 'submittedAt', 'status'] // Explicitly select attributes
      });

       const surveyResponseIds = surveyResponses.map(response => response.id);

       if (surveyResponseIds.length > 0) {
         questionResponses = await SurveyQuestionResponse.findAll({
           where: { surveyResponseId: { [Op.in]: surveyResponseIds } },
           include: [{
             model: SurveyQuestion,
             as: 'question',
             attributes: ['type', 'question', 'id']
           }]
         });
       }
    }

    // Manually structure responses and calculate metrics
    const surveyMetrics = surveys.map(survey => {
      const responsesForSurvey = surveyResponses.filter(response => response.surveyId === survey.id);
      const responseCount = responsesForSurvey.length;
      const responseRate = totalProgramEmployees > 0 ? (responseCount / totalProgramEmployees) * 100 : 0;

      const questionResponsesForSurvey = questionResponses.filter(qr =>
        responsesForSurvey.some(response => response.id === qr.surveyResponseId)
      );

      const ratingResponses = questionResponsesForSurvey.filter(qr => qr.question?.type === 'rating' && qr.ratingValue !== null);

      const averageRating = ratingResponses.length > 0
        ? ratingResponses.reduce((sum, qr) => sum + qr.ratingValue, 0) / ratingResponses.length
        : null;

      return {
        surveyId: survey.id,
        title: survey.title,
        type: survey.type,
        status: survey.status,
        responseRate,
        totalResponses: responseCount,
        pendingResponses: totalProgramEmployees - responseCount,
        averageRating,
        // Can add aggregated question data here if needed
      };
    });

    // Get training completion for required courses within the program
    let employeesWithCompletedRequiredTraining = 0;
    let trainingCompletionRate = 0;

    if (employeeIds.length > 0) {
      const completedRequiredTraining = await UserCourse.findAll({
        where: {
          userId: { [Op.in]: employeeIds },
          [Op.or]: [
            { progress: 100 },
            { completedAt: { [Op.ne]: null } }
          ]
        },
        include: [{
          model: Course,
          as: 'course',
          attributes: [],
          where: { isRequired: true },
          required: true // Inner join to only get UserCourses linked to required Courses
        }],
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('UserCourse.userId')), 'userId']], // Select distinct user IDs
        raw: true
      });

      employeesWithCompletedRequiredTraining = completedRequiredTraining.length;
      trainingCompletionRate = totalProgramEmployees > 0 ? (employeesWithCompletedRequiredTraining / totalProgramEmployees) * 100 : 0;
    }

    res.json({
      programInfo: program,
      totalProgramEmployees,
      surveyMetrics,
      trainingCompletion: {
        employeesWithCompletedRequiredTraining,
        trainingCompletionRate
      }
    });

  } catch (error) {
    console.error('Error fetching program analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get organization-wide KPIs
const getOrganizationKPIs = async (req, res) => {
  try {
    const requestedKPIs = req.query.fields ? req.query.fields.split(',') : ['trainingCompletion', 'surveyParticipation', 'averageRating'];

    const kpiResults = {};

    // 1. Overall Training Completion Rate
    if (requestedKPIs.includes('trainingCompletion')) {
      const totalEmployees = await User.count({ where: { role: 'employee' } });
      let employeesWithCompletedRequiredTraining = 0;
      if (totalEmployees > 0) {
        // Simplified query using literal
        const result = await sequelize.query(`
          SELECT COUNT(DISTINCT uc.userId) as completedCount
          FROM UserCourses uc
          JOIN Courses c ON uc.courseId = c.id
          WHERE c.isRequired = true
          AND (uc.progress = 100 OR uc.completedAt IS NOT NULL)
        `, { type: sequelize.QueryTypes.SELECT });
        
        employeesWithCompletedRequiredTraining = result[0].completedCount;
      }
      kpiResults.overallTrainingCompletionRate = totalEmployees > 0 ? (employeesWithCompletedRequiredTraining / totalEmployees) * 100 : 0;
    }

    // 2. Average Survey Participation Rate
    if (requestedKPIs.includes('surveyParticipation')) {
      const totalEmployees = await User.count({ where: { role: 'employee' } });
      const employeesWithSurveyResponse = await SurveyResponse.count({
        distinct: true,
        col: 'userId'
      });
      kpiResults.averageSurveyParticipationRate = totalEmployees > 0 ? (employeesWithSurveyResponse / totalEmployees) * 100 : 0;
    }

    // 3. Average Evaluation Rating
    if (requestedKPIs.includes('averageRating')) {
      // Calculate average score using raw SQL query
      const result = await sequelize.query(`
        SELECT AVG(ec.rating) as averageRating
        FROM EvaluationCriteria ec
        JOIN Evaluations e ON ec.evaluationId = e.id
        WHERE ec.rating IS NOT NULL
        AND e.status = 'completed'
      `, { type: sequelize.QueryTypes.SELECT });

      kpiResults.averageEvaluationRating = result[0].averageRating;
    }

    res.json(kpiResults);

  } catch (error) {
    console.error('Error fetching organization KPIs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrganizationDashboard,
  getCompletionRates,
  getFeedbackParticipation,
  getSurveyTrends,
  getTrainingCompletion,
  getEvaluationEffectiveness,
  getUserAnalytics,
  getProgramAnalytics,
  getOrganizationKPIs
}; 