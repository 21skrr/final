const { User, Team, ChecklistProgress, OnboardingTask, UserTaskProgress, Evaluation, Feedback, Course, UserCourse, CoachingSession, EvaluationCriteria } = require('../models'); // Include necessary models
const { Op } = require('sequelize');

// Helper function to check if the requesting user is a supervisor of the target user
const isSupervisorOf = async (supervisorId, employeeId) => {
    const supervisor = await User.findByPk(supervisorId, {
        include: [{
            model: User,
            as: 'subordinates',
            where: { id: employeeId },
            required: true // Inner join to check for direct supervision
        }]
    });
    return !!supervisor;
};

// Helper function to check if the requesting user is a supervisor of any member of the target team
const isSupervisorOfTeam = async (supervisorId, teamId) => {
    const supervisor = await User.findByPk(supervisorId, {
        include: [{
            model: User,
            as: 'subordinates',
            include: [{
                model: Team,
                where: { id: teamId },
                required: true // Inner join to check if subordinate is in the team
            }],
            required: true // Inner join to ensure the user has subordinates
        }]
    });
    return !!supervisor;
};


// Export Team Reports (e.g., CSV, PDF)
const exportTeamReports = async (req, res) => {
    try {
        const teamId = req.params.teamId; // Assuming teamId is part of the route params
        const requestingUser = req.user; // Assuming user info is attached by auth middleware
        const format = req.query.format ? req.query.format.toLowerCase() : 'json'; // Get desired format, default to json

        // Authorization check: Ensure the user is a supervisor of this team
        // This check might need refinement based on your exact supervisor-team relationship
        // For simplicity, assuming supervisorId is on the User model and teamId is on the User model
        // and a supervisor can access reports for a team if they supervise at least one member of that team.
        // A more robust check might involve a specific supervisor-team association table.
         
        // For now, we will skip detailed supervisor-team auth and focus on the report logic.
        // You should implement proper authorization here.

        // Fetch team members
        const team = await Team.findByPk(teamId, {
            include: [{
                model: User,
                as: 'Users',
                attributes: ['id', 'name', 'role']
            }]
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const teamMemberIds = team.Users.map(member => member.id);

        // Fetch evaluations for team members
        const evaluations = await Evaluation.findAll({
            where: {
                employeeId: { [Op.in]: teamMemberIds },
                status: 'completed'
            },
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
            include: [{
                model: EvaluationCriteria,
                as: 'criteria',
                attributes: ['category', 'rating', 'comments']
            }]
        });

        // Calculate average evaluation rating
        let totalRating = 0;
        let ratingCount = 0;
        evaluations.forEach(evaluation => {
            evaluation.criteria.forEach(criteria => {
                if (criteria.rating !== null) {
                    totalRating += criteria.rating;
                    ratingCount++;
                }
            });
        });
        const averageEvaluationRating = ratingCount > 0 ? totalRating / ratingCount : null;

        // Fetch completed tasks for team members
        const completedTasks = await UserTaskProgress.findAll({
            where: {
                userId: { [Op.in]: teamMemberIds },
                isCompleted: true
            },
            include: [{
                model: OnboardingTask,
                as: 'onboardingTask',
                attributes: ['id', 'title', 'description']
            }]
        });

        // Fetch completed required courses for team members
        const completedRequiredCourses = await UserCourse.findAll({
            where: {
                userId: { [Op.in]: teamMemberIds },
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

        // Fetch feedback sent and received by team members
        const feedbackSent = await Feedback.findAll({
            where: { fromUserId: { [Op.in]: teamMemberIds } },
            attributes: ['id', 'message', 'createdAt'],
            include: [{
                model: User, as: 'receiver', attributes: ['id', 'name', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });

        const feedbackReceived = await Feedback.findAll({
            where: { toUserId: { [Op.in]: teamMemberIds } },
            attributes: ['id', 'message', 'createdAt'],
            include: [{
                model: User, as: 'sender', attributes: ['id', 'name', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Fetch coaching sessions for team members
        const coachingSessions = await CoachingSession.findAll({
            where: { employeeId: { [Op.in]: teamMemberIds } },
            attributes: ['id', 'scheduledFor', 'status', 'notes']
        });

        // Prepare data for export
        const exportData = {
            teamId: team.id,
            teamName: team.name,
            averageEvaluationRating,
            completedTasksCount: completedTasks.length,
            completedRequiredCoursesCount: completedRequiredCourses.length,
            feedbackSentCount: feedbackSent.length,
            feedbackReceivedCount: feedbackReceived.length,
            coachingSessionsCount: coachingSessions.length,
            evaluations: evaluations,
            completedTasks,
            completedRequiredCourses,
            feedbackSent,
            feedbackReceived,
            coachingSessions
        };

        // Format and send response based on format parameter
        switch (format) {
            case 'csv':
                // Implement CSV formatting and send response
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=team_report_${teamId}_summary.csv`);

                // Generate CSV content (summary data)
                const csvHeaders = ['Team ID', 'Team Name', 'Average Evaluation Rating', 'Completed Tasks Count', 'Completed Required Courses Count', 'Feedback Sent Count', 'Feedback Received Count', 'Coaching Sessions Count'].join(',');
                const csvData = [
                    exportData.teamId,
                    `"${exportData.teamName.replace(/-/g, '--').replace(/"/g, '""')}"`, // Handle commas and quotes in team name
                    exportData.averageEvaluationRating !== null ? exportData.averageEvaluationRating.toFixed(2) : '',
                    exportData.completedTasksCount,
                    exportData.completedRequiredCoursesCount,
                    exportData.feedbackSentCount,
                    exportData.feedbackReceivedCount,
                    exportData.coachingSessionsCount
                ].join(',');

                const csvContent = `${csvHeaders}\n${csvData}`;

                res.status(200).send(csvContent);
                // res.status(501).json({ message: 'CSV export not implemented' }); // Not implemented yet
                break;
            case 'pdf':
                // Implement PDF formatting and send response
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=team_report_${teamId}.pdf`);
                
                // TODO: Add PDF generation library import here (e.g., const PDFDocument = require('pdfkit');).
                const PDFDocument = require('pdfkit'); // Assuming pdfkit is installed

                try {
                    const doc = new PDFDocument();

                    // Pipe the PDF to the response stream
                    doc.pipe(res);

                    // TODO: Add your PDF content generation logic here using the 'exportData' object.
                    doc.fontSize(16).text(`Team Report for ${exportData.teamName}`, { align: 'center' });
                    doc.moveDown();
                    doc.fontSize(12).text(`Average Evaluation Rating: ${exportData.averageEvaluationRating !== null ? exportData.averageEvaluationRating.toFixed(2) : 'N/A'}`);
                    doc.text(`Completed Tasks: ${exportData.completedTasksCount}`);
                    doc.text(`Completed Required Courses: ${exportData.completedRequiredCoursesCount}`);
                    doc.text(`Feedback Sent: ${exportData.feedbackSentCount}`);
                    doc.text(`Feedback Received: ${exportData.feedbackReceivedCount}`);
                    doc.text(`Coaching Sessions: ${exportData.coachingSessionsCount}`);
                    // Add more details from exportData as needed

                    // Finalize the PDF and end the stream
                    doc.end();

                } catch (pdfError) {
                    console.error('Error generating PDF report:', pdfError);
                    res.status(500).json({ message: 'Error generating PDF report' });
                }
                
                // res.status(501).json({ message: 'PDF export not implemented' }); // Not implemented yet
                break;
            case 'excel':
                // Implement Excel formatting and send response
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=team_report_${teamId}.xlsx`);

                // TODO: Add Excel generation library import here (e.g., const ExcelJS = require('exceljs');).
                const ExcelJS = require('exceljs'); // Assuming exceljs is installed

                try {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('Team Summary');

                    // TODO: Add your Excel content generation logic here using the 'exportData' object.
                    worksheet.addRow(['Team Report Summary']);
                    worksheet.addRow([]); // Blank row
                    worksheet.addRow(['Team ID', exportData.teamId]);
                    worksheet.addRow(['Team Name', exportData.teamName]);
                    worksheet.addRow(['Average Evaluation Rating', exportData.averageEvaluationRating !== null ? exportData.averageEvaluationRating.toFixed(2) : 'N/A']);
                    worksheet.addRow(['Completed Tasks', exportData.completedTasksCount]);
                    worksheet.addRow(['Completed Required Courses', exportData.completedRequiredCoursesCount]);
                    worksheet.addRow(['Feedback Sent', exportData.feedbackSentCount]);
                    worksheet.addRow(['Feedback Received', exportData.feedbackReceivedCount]);
                    worksheet.addRow(['Coaching Sessions', exportData.coachingSessionsCount]);
                    // Add more details from exportData as needed

                    // Write to response
                    await workbook.xlsx.write(res);
                    res.status(200).end();

                } catch (excelError) {
                    console.error('Error generating Excel report:', excelError);
                    res.status(500).json({ message: 'Error generating Excel report' });
                }

                // res.status(501).json({ message: 'Excel export not implemented' }); // Not implemented yet
                break;
            case 'json':
            default:
                // Default to JSON
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(exportData);
                break;
        }

    } catch (error) {
        console.error('Error exporting team reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Onboarding Bottlenecks Analysis for a team
const getTeamBottlenecksAnalysis = async (req, res) => {
    try {
        const teamId = req.params.teamId; // Assuming teamId is part of the route params
        const requestingUser = req.user; // Assuming user info is attached by auth middleware

         // Authorization check (similar to exportTeamReports - implement proper auth)

        // Fetch team members
        const team = await Team.findByPk(teamId, {
            include: [{
                model: User,
                as: 'Users',
                attributes: ['id', 'name', 'role']
            }]
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const teamMemberIds = team.Users.map(member => member.id);

        // Fetch all onboarding tasks
        const onboardingTasks = await OnboardingTask.findAll({
            attributes: ['id', 'title', 'description']
        });

        // Fetch task progress for team members
        const taskProgress = await UserTaskProgress.findAll({
            where: { userId: { [Op.in]: teamMemberIds } },
            include: [{
                model: OnboardingTask,
                as: 'onboardingTask',
                attributes: ['id', 'title', 'description']
            }]
        });

        // Analyze bottlenecks
        const bottlenecks = [];
        onboardingTasks.forEach(task => {
            const progressForTask = taskProgress.filter(progress => progress.onboardingTask.id === task.id);
            const completedCount = progressForTask.filter(progress => progress.isCompleted).length;
            const completionRate = progressForTask.length > 0 ? (completedCount / progressForTask.length) * 100 : 0;

            // Calculate average completion time (if applicable)
            let totalCompletionTime = 0;
            let completionTimeCount = 0;
            progressForTask.forEach(progress => {
                if (progress.isCompleted && progress.completedAt && progress.startedAt) {
                    const completionTime = progress.completedAt - progress.startedAt;
                    totalCompletionTime += completionTime;
                    completionTimeCount++;
                }
            });
            const averageCompletionTime = completionTimeCount > 0 ? totalCompletionTime / completionTimeCount : null;

            // Identify bottlenecks based on completion rate and average completion time
            if (completionRate < 50 || (averageCompletionTime && averageCompletionTime > 7 * 24 * 60 * 60 * 1000)) { // Example: Less than 50% completion or average time > 7 days
                bottlenecks.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    completionRate,
                    averageCompletionTime: averageCompletionTime ? averageCompletionTime / (24 * 60 * 60 * 1000) : null, // Convert to days
                    totalAssigned: progressForTask.length,
                    completedCount
                });
            }
        });

        res.status(200).json(bottlenecks);
    } catch (error) {
        console.error('Error fetching team bottlenecks analysis:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Team Performance Reports
const getTeamPerformanceReports = async (req, res) => {
    try {
        const teamId = req.params.teamId; // Assuming teamId is part of the route params
        const requestingUser = req.user; // Assuming user info is attached by auth middleware

         // Authorization check (similar to exportTeamReports - implement proper auth)

        // Fetch team members
        const team = await Team.findByPk(teamId, {
            include: [{
                model: User,
                as: 'Users',
                attributes: ['id', 'name', 'role']
            }]
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const teamMemberIds = team.Users.map(member => member.id);

        // Fetch evaluations for team members
        const evaluations = await Evaluation.findAll({
            where: {
                employeeId: { [Op.in]: teamMemberIds },
                status: 'completed'
            },
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
            include: [{
                model: EvaluationCriteria,
                as: 'criteria',
                attributes: ['category', 'rating', 'comments']
            }]
        });

        // Calculate average evaluation rating
        let totalRating = 0;
        let ratingCount = 0;
        evaluations.forEach(evaluation => {
            evaluation.criteria.forEach(criteria => {
                if (criteria.rating !== null) {
                    totalRating += criteria.rating;
                    ratingCount++;
                }
            });
        });
        const averageEvaluationRating = ratingCount > 0 ? totalRating / ratingCount : null;

        // Fetch completed tasks for team members
        const completedTasks = await UserTaskProgress.findAll({
            where: {
                userId: { [Op.in]: teamMemberIds },
                isCompleted: true
            },
            include: [{
                model: OnboardingTask,
                as: 'onboardingTask',
                attributes: ['id', 'title', 'description']
            }]
        });

        // Fetch completed required courses for team members
        const completedRequiredCourses = await UserCourse.findAll({
            where: {
                userId: { [Op.in]: teamMemberIds },
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

        // Fetch feedback sent and received by team members
        const feedbackSent = await Feedback.findAll({
            where: { fromUserId: { [Op.in]: teamMemberIds } },
            attributes: ['id', 'message', 'createdAt'],
            include: [{
                model: User, as: 'receiver', attributes: ['id', 'name', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });

        const feedbackReceived = await Feedback.findAll({
            where: { toUserId: { [Op.in]: teamMemberIds } },
            attributes: ['id', 'message', 'createdAt'],
            include: [{
                model: User, as: 'sender', attributes: ['id', 'name', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Fetch coaching sessions for team members
        const coachingSessions = await CoachingSession.findAll({
            where: { employeeId: { [Op.in]: teamMemberIds } },
            attributes: ['id', 'scheduledFor', 'status', 'notes']
        });

        res.status(200).json({
            teamId: team.id,
            teamName: team.name,
            averageEvaluationRating,
            completedTasksCount: completedTasks.length,
            completedRequiredCoursesCount: completedRequiredCourses.length,
            feedbackSentCount: feedbackSent.length,
            feedbackReceivedCount: feedbackReceived.length,
            coachingSessionsCount: coachingSessions.length,
            // Optionally include detailed lists:
            // evaluations,
            // completedTasks,
            // completedRequiredCourses,
            // feedbackSent,
            // feedbackReceived,
            // coachingSessions
        });
    } catch (error) {
        console.error('Error fetching team performance reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    exportTeamReports,
    getTeamBottlenecksAnalysis,
    getTeamPerformanceReports,
}; 