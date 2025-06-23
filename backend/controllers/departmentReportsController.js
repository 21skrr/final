const { Department, User, ReportSchedule, ReportExecution, OnboardingProgress } = require('../models'); // Include necessary models
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// POST /api/reports/schedule/department
const scheduleDepartmentReport = async (req, res) => {
    try {
        const { departmentId, reportType, schedule, recipients } = req.body;

        // Validate required fields
        if (!departmentId || !reportType || !schedule || !recipients) {
            return res.status(400).json({ 
                message: 'Missing required parameters',
                required: ['departmentId', 'reportType', 'schedule', 'recipients']
            });
        }

        // Validate department exists
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Validate report type
        const validReportTypes = ['onboarding_completion', 'performance_summary', 'feedback_analysis'];
        if (!validReportTypes.includes(reportType)) {
            return res.status(400).json({ 
                message: 'Invalid report type',
                validTypes: validReportTypes
            });
        }

        // Create report schedule
        const newSchedule = await ReportSchedule.create({
            departmentId,
            reportType,
            schedule,
            recipients: JSON.stringify(recipients),
            scheduledBy: req.user.id,
            status: 'active'
        });

        res.status(201).json({ 
            message: 'Department report scheduled successfully',
            schedule: {
                id: newSchedule.id,
                departmentId,
                reportType,
                schedule,
                recipients,
                status: newSchedule.status
            }
        });
    } catch (error) {
        console.error('Error scheduling department report:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};

// GET /api/reports/export/department
const exportDepartmentReport = async (req, res) => {
    try {
        console.log('Received query parameters:', req.query); // Add this line for debugging
        const { departmentId, reportType, format = 'json' } = req.query;

        // Validate required parameters
        if (!departmentId || !reportType) {
            return res.status(400).json({ 
                message: 'Missing required parameters',
                required: ['departmentId', 'reportType']
            });
        }

        // Validate department exists
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Get department users
        const departmentUsers = await User.findAll({
            where: { department: departmentId },
            attributes: ['id', 'name', 'email', 'role']
        });

        let reportData = {};

        // Generate report based on type
        switch (reportType) {
            case 'onboarding_completion':
                const departmentEmployeeIds = departmentUsers.map(emp => emp.id);
                
                const onboardingProgress = await OnboardingProgress.findAll({
                    where: {
                        UserId: { [Op.in]: departmentEmployeeIds }
                    },
                    include: [{
                        model: User,
                        attributes: ['name', 'email']
                    }]
                });

                const completedOnboarding = onboardingProgress.filter(progress => 
                    progress.stage === 'excel' && progress.progress === 100
                );

                reportData = {
                    departmentId,
                    departmentName: department.name,
                    reportType,
                    totalEmployees: departmentUsers.length,
                    completedOnboarding: completedOnboarding.length,
                    completionRate: departmentUsers.length > 0 
                        ? ((completedOnboarding.length / departmentUsers.length) * 100).toFixed(2)
                        : 0,
                    employeeProgress: onboardingProgress.map(progress => ({
                        userId: progress.UserId,
                        name: progress.User.name,
                        email: progress.User.email,
                        stage: progress.stage,
                        progress: progress.progress
                    }))
                };
                break;

            default:
                return res.status(400).json({ 
                    message: 'Invalid report type',
                    validTypes: ['onboarding_completion']
                });
        }

        // Format response based on requested format
        switch (format.toLowerCase()) {
            case 'csv': {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=department_report_${departmentId}_${reportType}.csv`);
                
                // Prepare data for CSV
                let csvContent = '';

                // Add summary data
                const summaryHeaders = ['Department ID', 'Department Name', 'Report Type', 'Total Employees', 'Completed Onboarding', 'Completion Rate'];
                const summaryRow = [reportData.departmentId, reportData.departmentName, reportData.reportType, reportData.totalEmployees, reportData.completedOnboarding, reportData.completionRate];
                csvContent += summaryHeaders.join(',') + '\n';
                csvContent += summaryRow.join(',') + '\n\n';

                // Add employee progress data
                if (reportData.employeeProgress && reportData.employeeProgress.length > 0) {
                    const employeeHeaders = ['User ID', 'Name', 'Email', 'Stage', 'Progress'];
                    csvContent += employeeHeaders.join(',') + '\n';
                    reportData.employeeProgress.forEach(employee => {
                        const employeeRow = [employee.userId, employee.name, employee.email, employee.stage, employee.progress];
                        csvContent += employeeRow.join(',') + '\n';
                    });
                }

                return res.status(200).send(csvContent);
            }

            case 'excel': {
                try {
                    const wb = XLSX.utils.book_new();
                    const ws_data = [];

                    // Add summary data to sheet 1
                    const summaryHeaders = ['Department ID', 'Department Name', 'Report Type', 'Total Employees', 'Completed Onboarding', 'Completion Rate'];
                    const summaryRow = [reportData.departmentId, reportData.departmentName, reportData.reportType, reportData.totalEmployees, reportData.completedOnboarding, reportData.completionRate];
                    ws_data.push(summaryHeaders);
                    ws_data.push(summaryRow);

                    // Add employee progress data to sheet 2 or same sheet with separator
                    if (reportData.employeeProgress && reportData.employeeProgress.length > 0) {
                         ws_data.push([]); // Empty row for separation
                        const employeeHeaders = ['User ID', 'Name', 'Email', 'Stage', 'Progress'];
                        ws_data.push(employeeHeaders);
                        reportData.employeeProgress.forEach(employee => {
                            ws_data.push([employee.userId, employee.name, employee.email, employee.stage, employee.progress]);
                        });
                    }

                    const ws = XLSX.utils.aoa_to_sheet(ws_data);
                    XLSX.utils.book_append_sheet(wb, ws, 'Department Report');

                    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', bookSST: false });

                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename=department_report_${departmentId}_${reportType}.xlsx`);
                    return res.send(excelBuffer);

                } catch (error) {
                    console.error("Error generating Excel file:", error);
                    if (!res.headersSent) {
                        return res.status(500).json({ message: "Error generating Excel file" });
                    }
                }
                return;
            }

            case 'pdf': {
                try {
                    const doc = new PDFDocument();

                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename=department_report_${departmentId}_${reportType}.pdf`);

                    doc.pipe(res);

                    // Add content to PDF
                    doc.fontSize(16).text('Department Report', { align: 'center' });
                    doc.moveDown();

                    doc.fontSize(12).text(`Department ID: ${reportData.departmentId}`);
                    doc.text(`Department Name: ${reportData.departmentName}`);
                    doc.text(`Report Type: ${reportData.reportType}`);
                    doc.text(`Total Employees: ${reportData.totalEmployees}`);
                    doc.text(`Completed Onboarding: ${reportData.completedOnboarding}`);
                    doc.text(`Completion Rate: ${reportData.completionRate}`);
                    doc.moveDown();

                    if (reportData.employeeProgress && reportData.employeeProgress.length > 0) {
                        doc.fontSize(14).text('Employee Progress:');
                        doc.moveDown();

                        reportData.employeeProgress.forEach(employee => {
                            doc.fontSize(12).text(`- ${employee.name} (${employee.email}): Stage - ${employee.stage}, Progress - ${employee.progress}%`);
                        });
                    }

                    doc.end();

                } catch (error) {
                    console.error("Error generating PDF file:", error);
                    if (!res.headersSent) {
                        return res.status(500).json({ message: "Error generating PDF file" });
                    }
                }
                return;
            }

            case 'json':
            default:
                return res.status(200).json(reportData);
        }

    } catch (error) {
        console.error('Error exporting department report:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};

module.exports = {
    scheduleDepartmentReport,
    exportDepartmentReport,
}; 