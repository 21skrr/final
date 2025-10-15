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
  ChecklistProgress,
  SupervisorAssessment
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

// Evaluation effectiveness and trends
const getEvaluationEffectiveness = async (req, res) => {
  try {
    // Get all evaluations with user data
    const allEvaluations = await Evaluation.findAll({
      include: [{
        model: User,
        as: 'employee',
        attributes: ['department', 'programType'],
        where: { role: 'employee' }
      }],
      attributes: ['type', 'status', 'overallScore', 'createdAt']
    });

    // Process data in JavaScript instead of complex SQL
    const departmentStats = {};
    const typeStats = {};
    const monthlyStats = {};

    allEvaluations.forEach((evaluation) => {
      const user = evaluation.employee;
      if (!user) return;

      const department = user.department || 'Unknown';
      const programType = user.programType || 'Unknown';
      const type = evaluation.type;
      const status = evaluation.status;
      const score = evaluation.overallScore;
      const month = evaluation.createdAt ? evaluation.createdAt.toISOString().substring(0, 7) : null;

      // Department stats
      const deptKey = `${department}-${programType}-${type}`;
      if (!departmentStats[deptKey]) {
        departmentStats[deptKey] = {
          department,
          programType,
          evaluationType: type,
          totalEvaluations: 0,
          completedEvaluations: 0,
          pendingEvaluations: 0,
          inProgressEvaluations: 0,
          totalScore: 0,
          scoreCount: 0
        };
      }

      departmentStats[deptKey].totalEvaluations++;
      if (status === 'completed') departmentStats[deptKey].completedEvaluations++;
      if (status === 'pending') departmentStats[deptKey].pendingEvaluations++;
      if (status === 'in_progress') departmentStats[deptKey].inProgressEvaluations++;
      if (score) {
        departmentStats[deptKey].totalScore += score;
        departmentStats[deptKey].scoreCount++;
      }

      // Type stats
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, completed: 0 };
      }
      typeStats[type].total++;
      if (status === 'completed') typeStats[type].completed++;

      // Monthly stats (last 6 months)
      if (month) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const evaluationDate = new Date(evaluation.createdAt);
        
        if (evaluationDate >= sixMonthsAgo) {
          if (!monthlyStats[month]) {
            monthlyStats[month] = {
              totalEvaluations: 0,
              completedEvaluations: 0,
              totalScore: 0,
              scoreCount: 0
            };
          }
          monthlyStats[month].totalEvaluations++;
          if (status === 'completed') monthlyStats[month].completedEvaluations++;
          if (score) {
            monthlyStats[month].totalScore += score;
            monthlyStats[month].scoreCount++;
          }
        }
      }
    });

    // Format the results
    const formattedResults = {
      departmentStats: Object.values(departmentStats).map(dept => ({
        department: dept.department,
        programType: dept.programType,
        evaluationType: dept.evaluationType,
        totalEvaluations: dept.totalEvaluations,
        completedEvaluations: dept.completedEvaluations,
        pendingEvaluations: dept.pendingEvaluations,
        inProgressEvaluations: dept.inProgressEvaluations,
        completionRate: dept.totalEvaluations > 0 ? (dept.completedEvaluations / dept.totalEvaluations) * 100 : 0,
        averageScore: dept.scoreCount > 0 ? dept.totalScore / dept.scoreCount : 0
      })),
      typeDistribution: Object.entries(typeStats).map(([type, stats]) => ({
        type,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      })),
      recentTrends: Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => ({
          month,
          totalEvaluations: stats.totalEvaluations,
          completedEvaluations: stats.completedEvaluations,
          completionRate: stats.totalEvaluations > 0 ? (stats.completedEvaluations / stats.totalEvaluations) * 100 : 0,
          averageScore: stats.scoreCount > 0 ? stats.totalScore / stats.scoreCount : 0
        }))
    };

    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching evaluation effectiveness:', error);
    res.status(500).json({ message: "Server error", error: error.message });
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

// Onboarding Stage Distribution
const getOnboardingStageDistribution = async (req, res) => {
  try {
    const result = await OnboardingProgress.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('OnboardingProgress.id')), 'count']
      ],
      group: ['stage'],
      raw: true
    });

    const formattedResult = result.map(item => ({
      stage: item.stage,
      count: parseInt(item.count),
      percentage: 0 // Will be calculated on frontend
    }));

    // Calculate total for percentage calculation
    const total = formattedResult.reduce((sum, item) => sum + item.count, 0);
    formattedResult.forEach(item => {
      item.percentage = total > 0 ? (item.count / total) * 100 : 0;
    });

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching onboarding stage distribution:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Supervisor Assessment Completion Rates
const getSupervisorAssessmentCompletionRates = async (req, res) => {
  try {
    const result = await SupervisorAssessment.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('SupervisorAssessment.id')), 'totalAssessments'],
        [sequelize.literal('COUNT(CASE WHEN status IN ("hr_approved", "completed") THEN 1 ELSE NULL END)'), 'completedAssessments'],
        [sequelize.literal('COUNT(CASE WHEN status = "pending_certificate" THEN 1 ELSE NULL END)'), 'pendingCertificate'],
        [sequelize.literal('COUNT(CASE WHEN status = "certificate_uploaded" THEN 1 ELSE NULL END)'), 'certificateUploaded'],
        [sequelize.literal('COUNT(CASE WHEN status = "assessment_pending" THEN 1 ELSE NULL END)'), 'assessmentPending'],
        [sequelize.literal('COUNT(CASE WHEN status = "assessment_completed" THEN 1 ELSE NULL END)'), 'assessmentCompleted'],
        [sequelize.literal('COUNT(CASE WHEN status = "decision_pending" THEN 1 ELSE NULL END)'), 'decisionPending'],
        [sequelize.literal('COUNT(CASE WHEN status = "decision_made" THEN 1 ELSE NULL END)'), 'decisionMade'],
        [sequelize.literal('COUNT(CASE WHEN status = "hr_approval_pending" THEN 1 ELSE NULL END)'), 'hrApprovalPending'],
        [sequelize.literal('COUNT(CASE WHEN status = "hr_rejected" THEN 1 ELSE NULL END)'), 'hrRejected']
      ],
      raw: true
    });

    const data = result[0] || {};
    const totalAssessments = parseInt(data.totalAssessments) || 0;
    const completedAssessments = parseInt(data.completedAssessments) || 0;

    const formattedResult = {
      totalAssessments,
      completedAssessments,
      completionRate: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0,
      statusBreakdown: {
        pendingCertificate: parseInt(data.pendingCertificate) || 0,
        certificateUploaded: parseInt(data.certificateUploaded) || 0,
        assessmentPending: parseInt(data.assessmentPending) || 0,
        assessmentCompleted: parseInt(data.assessmentCompleted) || 0,
        decisionPending: parseInt(data.decisionPending) || 0,
        decisionMade: parseInt(data.decisionMade) || 0,
        hrApprovalPending: parseInt(data.hrApprovalPending) || 0,
        hrRejected: parseInt(data.hrRejected) || 0
      }
    };

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching supervisor assessment completion rates:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Onboarding Completion Time by Department
const getOnboardingCompletionTimeByDepartment = async (req, res) => {
  try {
    // Get all onboarding progress with user data
    const onboardingData = await OnboardingProgress.findAll({
      include: [{
        model: User,
        attributes: ['department'],
        where: { role: 'employee' }
      }],
      attributes: ['stage', 'progress', 'updatedAt', 'stageStartDate']
    });

    // Group by department and calculate metrics
    const departmentStats = {};

    onboardingData.forEach((item) => {
      const department = item.User?.department || 'Unknown';
      
      if (!departmentStats[department]) {
        departmentStats[department] = {
          department,
          totalEmployees: 0,
          completedEmployees: 0,
          completionTimes: [],
          stageDistribution: {
            preOnboarding: 0,
            phase1: 0,
            phase2: 0
          }
        };
      }

      departmentStats[department].totalEmployees++;
      
      // Count by stage
      if (item.stage === 'pre_onboarding') {
        departmentStats[department].stageDistribution.preOnboarding++;
      } else if (item.stage === 'phase_1') {
        departmentStats[department].stageDistribution.phase1++;
      } else if (item.stage === 'phase_2') {
        departmentStats[department].stageDistribution.phase2++;
      }

      // Check if completed (phase_2 with 100% progress)
      if (item.stage === 'phase_2' && item.progress === 100) {
        departmentStats[department].completedEmployees++;
        
        // Calculate completion time
        if (item.updatedAt && item.stageStartDate) {
          const completionTime = Math.floor((new Date(item.updatedAt) - new Date(item.stageStartDate)) / (1000 * 60 * 60 * 24));
          departmentStats[department].completionTimes.push(completionTime);
        }
      }
    });

    // Format results
    const formattedResult = Object.values(departmentStats).map((dept) => ({
      department: dept.department,
      totalEmployees: dept.totalEmployees,
      completedEmployees: dept.completedEmployees,
      completionRate: dept.totalEmployees > 0 ? (dept.completedEmployees / dept.totalEmployees) * 100 : 0,
      avgCompletionTimeDays: dept.completionTimes.length > 0 
        ? dept.completionTimes.reduce((sum, time) => sum + time, 0) / dept.completionTimes.length 
        : 0,
      stageDistribution: dept.stageDistribution
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching onboarding completion time by department:', error);
    res.status(500).json({ message: "Server error", error: error.message });
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
  getOrganizationKPIs,
  getOnboardingStageDistribution,
  getSupervisorAssessmentCompletionRates,
  getOnboardingCompletionTimeByDepartment
}; 