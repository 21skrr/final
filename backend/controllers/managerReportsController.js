const { User, OnboardingProgress, UserTaskProgress, OnboardingTask, Evaluation, Feedback, CoachingSession, Team, Course, UserCourse, Department } = require('../models'); // Include necessary models
const { Op } = require('sequelize');

// GET /api/reports/supervisor-activity
const getSupervisorActivityReport = async (req, res) => {
    try {
        const supervisorId = req.user.id; // Assuming the logged-in user is the supervisor

        // Fetch coaching sessions held by this supervisor
        const coachingSessionsCount = await CoachingSession.count({
            where: { supervisorId: supervisorId }
        });

        // Fetch evaluations completed by this supervisor
        const evaluationsCompletedCount = await Evaluation.count({
            where: { evaluatorId: supervisorId }
        });

        // Fetch feedback sent by this supervisor
        const feedbackSentCount = await Feedback.count({
            where: { fromUserId: supervisorId }
        });

        // Fetch the number of direct reports for this supervisor
        const directReportsCount = await User.count({
            where: { supervisorId: supervisorId }
        });

        res.status(200).json({
            supervisorId: supervisorId,
            directReportsCount,
            coachingSessionsCount,
            evaluationsCompletedCount,
            feedbackSentCount,
        });
    } catch (error) {
        console.error('Error fetching supervisor activity report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reports/onboarding-health
const getOnboardingHealthReport = async (req, res) => {
    try {
        // Fetch all employees (or filter based on query params like department, program)
        const departmentFilter = req.query.departmentId ? { department: req.query.departmentId } : {};
        const programFilter = req.query.programType ? { programType: req.query.programType } : {};

        const employees = await User.findAll({
            where: {
                role: 'employee', // Assuming we only consider employees for onboarding health
                ...departmentFilter,
                ...programFilter,
            },
            attributes: ['id'] // Only need IDs for counts and progress checks
        });

        const employeeIds = employees.map(emp => emp.id);

        if (employeeIds.length === 0) {
            return res.status(200).json({ message: 'No employees found for the selected criteria.', totalEmployees: 0 });
        }

        // Calculate overall onboarding completion rate (example: based on reaching the 'excel' stage)
        const completedOnboardingCount = await OnboardingProgress.count({
            where: {
                UserId: { [Op.in]: employeeIds },
                stage: 'excel',
                progress: 100,
            }
        });

        const overallCompletionRate = (completedOnboardingCount / employeeIds.length) * 100;

        // Identify potential bottlenecks (example: tasks with low completion rates across these employees)
        // This is a simplified example; a real-world scenario might involve more complex analysis

        // Fetch all onboarding tasks
        const onboardingTasks = await OnboardingTask.findAll({
            attributes: ['id', 'title']
        });

        const taskCompletionRates = await Promise.all(onboardingTasks.map(async (task) => {
            const completedTaskProgressCount = await UserTaskProgress.count({
                where: {
                    OnboardingTaskId: task.id,
                    userId: { [Op.in]: employeeIds },
                    isCompleted: true
                }
            });
            const totalAssignedCount = await UserTaskProgress.count({
                 where: {
                    OnboardingTaskId: task.id,
                    userId: { [Op.in]: employeeIds },
                }
            });

            const completionRate = totalAssignedCount > 0 ? (completedTaskProgressCount / totalAssignedCount) * 100 : 0;
            return { taskId: task.id, taskTitle: task.title, completionRate };
        }));

        // Filter for tasks with low completion rates (e.g., below 50%)
        const bottleneckTasks = taskCompletionRates.filter(task => task.completionRate < 50);

        res.status(200).json({
            totalEmployees: employeeIds.length,
            completedOnboardingCount,
            overallCompletionRate: overallCompletionRate.toFixed(2),
            bottleneckTasks
        });

    } catch (error) {
        console.error('Error fetching onboarding health report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reports/evaluations - Get evaluation reports
const getEvaluationReports = async (req, res) => {
    try {
        const { supervisorId, departmentId, startDate, endDate, programType } = req.query;
        const where = {};
        const include = [
            { model: User, as: "employee", attributes: ['id', 'name', 'departmentId', 'supervisorId', 'programType'], include: [{ model: Department, as: 'departmentInfo', attributes: ['id', 'name'] }] },
            { model: User, as: "supervisor", attributes: ['id', 'name'] },
        ];

        if (supervisorId) {
            where.evaluatorId = supervisorId; // Filter by the supervisor who created the evaluation
        }

        if (departmentId) {
            // Filter by the department of the employee being evaluated
            include[0].include[0].where = { id: departmentId };
        }

        if (programType) {
            include[0].where = { ...include[0].where, programType };
        }

        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            };
        } else if (startDate) {
            where.createdAt = {
                [Op.gte]: new Date(startDate),
            };
        } else if (endDate) {
            where.createdAt = {
                [Op.lte]: new Date(endDate),
            };
        }

        const evaluations = await Evaluation.findAll({
            where,
            include,
        });

        res.status(200).json(evaluations);

    } catch (error) {
        console.error('Error fetching evaluation reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSupervisorActivityReport,
    getOnboardingHealthReport,
    getEvaluationReports,
}; 