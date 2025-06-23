const { 
  User,
  Task,
  UserTaskProgress,
  CoachingSession,
  Feedback,
  Evaluation,
  EvaluationCriteria,
  Course,
  UserCourse,
  OnboardingTask
} = require('../models');

const { Op } = require('sequelize');

// Get completed tasks report
const getCompletedTasksReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const completedTasks = await UserTaskProgress.findAll({
      where: {
        userId: userId,
        isCompleted: true
      },
      include: [{
        model: OnboardingTask,
        as: 'onboardingTask',
        attributes: ['id', 'title', 'description']
      }]
    });

    res.status(200).json(completedTasks);
  } catch (error) {
    console.error('Error fetching completed tasks report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attended sessions report
const getAttendedSessionsReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const attendedSessions = await CoachingSession.findAll({
      where: {
        employeeId: userId,
        status: 'completed'
      },
      attributes: ['id', 'scheduledFor', 'status', 'notes']
    });

    res.status(200).json(attendedSessions);
  } catch (error) {
    console.error('Error fetching attended sessions report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get submitted feedback report
const getSubmittedFeedbackReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const submittedFeedback = await Feedback.findAll({
      where: {
        fromUserId: userId
      },
      attributes: ['id', 'message', 'createdAt'],
      include: [{
        model: User,
        as: 'receiver',
        attributes: ['id', 'name', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(submittedFeedback);
  } catch (error) {
    console.error('Error fetching submitted feedback report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get individual performance summary
const getIndividualPerformanceSummary = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from auth middleware

    // Fetch completed evaluations without including criteria
    const evaluations = await Evaluation.findAll({
      where: { employeeId: userId, status: 'completed' },
      attributes: [
        'id',
        'employeeId',
        'evaluatorId', // Use the correct column name
        'type',
        'status',
        'completedAt',
        'reviewedBy',
        'createdAt',
        'updatedAt',
      ], // Explicitly list attributes to select
      order: [['createdAt', 'DESC']]
    });

    // Extract evaluation IDs
    const evaluationIds = evaluations.map(eval => eval.id);

    // Fetch evaluation criteria separately if there are evaluations
    let evaluationCriteria = [];
    if (evaluationIds.length > 0) {
      evaluationCriteria = await EvaluationCriteria.findAll({
        where: {
          evaluationId: { [Op.in]: evaluationIds }, // Filter by fetched evaluation IDs
          score: { [Op.ne]: null } // Only include criteria with ratings
        },
        attributes: ['evaluationId', 'category', 'score', 'comments']
      });
    }

    // Manually associate criteria with evaluations and calculate average rating
    const evaluationsWithCriteria = evaluations.map(eval => {
        const criteriaForEvaluation = evaluationCriteria.filter(criteria => criteria.evaluationId === eval.id);
        return {
            ...eval.toJSON(),
            criteria: criteriaForEvaluation,
        };
    });

    // Calculate average evaluation rating from fetched criteria
    let averageEvaluationRating = null;
    let totalRatings = 0;
    let ratingSum = 0;

    evaluationCriteria.forEach(criteria => {
        if (criteria.score !== null) {
            ratingSum += criteria.score;
            totalRatings++;
        }
    });

    if (totalRatings > 0) {
      averageEvaluationRating = ratingSum / totalRatings;
    }

    // Fetch completed tasks
    const completedTasks = await UserTaskProgress.findAll({
      where: { userId: userId, isCompleted: true },
      include: [{
        model: OnboardingTask,
        as: 'onboardingTask',
        attributes: ['id', 'title', 'description']
      }]
    });

    // Fetch completed required courses
    const completedRequiredCourses = await UserCourse.findAll({
      where: {
        userId: userId,
        [Op.or]: [
          { progress: 100 },
          { completedAt: { [Op.ne]: null } }
        ]
      },
      include: [{
        model: Course,
        as: 'course',
        where: { isRequired: true },
        attributes: ['title'],
        required: true // Only include UserCourses linked to required Courses
      }]
    });

    // Fetch feedback sent and received
    const feedbackSent = await Feedback.findAll({
      where: { fromUserId: userId },
      attributes: ['id', 'message', 'createdAt'],
      include: [{
        model: User, as: 'receiver', attributes: ['id', 'name', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });

    const feedbackReceived = await Feedback.findAll({
      where: { toUserId: userId },
      attributes: ['id', 'message', 'createdAt'],
      include: [{
        model: User, as: 'sender', attributes: ['id', 'name', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      averageEvaluationRating,
      completedTasksCount: completedTasks.length,
      completedRequiredCoursesCount: completedRequiredCourses.length,
      feedbackSentCount: feedbackSent.length,
      feedbackReceivedCount: feedbackReceived.length,
      // Optionally include detailed lists:
      // evaluations: evaluationsWithCriteria,
      // completedTasks,
      // completedRequiredCourses,
      // feedbackSent,
      // feedbackReceived
    });

  } catch (error) {
    console.error('Error fetching individual performance summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Export all methods
module.exports = {
  getCompletedTasksReport,
  getAttendedSessionsReport,
  getSubmittedFeedbackReport,
  getIndividualPerformanceSummary
};
 