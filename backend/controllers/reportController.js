const { Report, User, Team, Department, Program } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// Helper function to build date range conditions
const buildDateRangeCondition = (timePeriod) => {
  const now = new Date();
  let startDate = null;
  let endDate = now;

  switch (timePeriod) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case 'last_year':
       startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    // Add more cases for other time periods (e.g., 'this_month', 'last_month', custom ranges)
    default:
      // No date filtering
      return null;
  }

  return { [Op.between]: [startDate, endDate] };
};

// GET /api/reports/export
const exportCustomReport = async (req, res) => {
  try {
    const { format = 'json', type, timePeriod, departmentId, role, programType, ...filterParams } = req.query; // Extract format, type, timePeriod, and other filter parameters
    const userRole = req.user.role; // Assuming user role is available in req.user
    const userId = req.user.id; // Assuming user ID is available in req.user

    let whereCondition = {};
    let includeOptions = [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'departmentId', 'role', 'programType', 'teamId']
        }
    ];

    // Filter by report type
    if (type) {
      whereCondition.type = type;
    }

    // Apply role-based access control and filtering
    switch (userRole) {
      case 'hr':
      case 'admin':
        // HR and Admin can access all reports and apply all filters
        if (departmentId) {
             includeOptions[0].where = { ...includeOptions[0].where, departmentId: departmentId };
        }
        if (role) {
             includeOptions[0].where = { ...includeOptions[0].where, role: role };
        }
        if (programType) {
             includeOptions[0].where = { ...includeOptions[0].where, programType: programType };
        }
        if (timePeriod) {
            const dateCondition = buildDateRangeCondition(timePeriod);
            if(dateCondition) whereCondition.createdAt = dateCondition;
        }
         // Add filtering based on filterParams (for parameters JSON) here if needed.
         // This is complex and depends on the structure of your 'parameters' JSON field.
         // Example: filtering reports where parameters.userId matches a query parameter
        // if (filterParams.userId) {
        //    whereCondition.parameters = { userId: filterParams.userId }; // Requires JSONB support or similar
        // }
        break;

      case 'manager':
        // Managers can access reports for teams and supervisors under their responsibility.
        // This requires fetching teams/users associated with the manager.
        const managerTeams = await Team.findAll({ where: { managerId: userId }, attributes: ['id'] });
        const managerTeamIds = managerTeams.map(team => team.id);

        const usersInManagerTeams = await User.findAll({ where: { teamId: { [Op.in]: managerTeamIds } }, attributes: ['id'] });
        const subordinateUsers = await User.findAll({ where: { supervisorId: userId }, attributes: ['id'] });
        const accessibleUserIds = [userId, ...usersInManagerTeams.map(user => user.id), ...subordinateUsers.map(user => user.id)]; // Include the manager themselves

        // Filter reports created by users under the manager's responsibility or reports directly relevant to them (if indicated in parameters)
        whereCondition[Op.or] = [
            { createdBy: { [Op.in]: accessibleUserIds } },
            // Add conditions here to filter reports based on parameters field if they are relevant to the manager's scope
            // Example: if report parameters include a list of userIds, check if any are in accessibleUserIds
            // { parameters: { [Op.contains]: { userIds: accessibleUserIds } } } // Requires JSONB or similar
             // Example: reports where the report parameters contain a userId that is one of the accessible users
            // { parameters: { userId: { [Op.in]: accessibleUserIds } } } // Requires JSONB or similar for complex queries
        ];

         // Apply filters that managers are allowed to use
         if (departmentId) {
             // Filter by department of the creator or users mentioned in report parameters
             // This requires more complex logic based on how department is stored/used in report parameters
             // For simplicity, let's assume filtering by the creator's department for now.
             includeOptions[0].where = { ...includeOptions[0].where, departmentId: departmentId };
         }
         if (role) {
             // Filter by role of the creator or users mentioned in report parameters
              // For simplicity, let's assume filtering by the creator's role for now.
              includeOptions[0].where = { ...includeOptions[0].where, role: role };
         }
         if (programType) {
              // Filter by program type of the creator or users mentioned in report parameters
              // For simplicity, let's assume filtering by the creator's program type for now.
             includeOptions[0].where = { ...includeOptions[0].where, programType: programType };
         }

         if (timePeriod) {
            const dateCondition = buildDateRangeCondition(timePeriod);
            if(dateCondition) whereCondition.createdAt = { ...whereCondition.createdAt, ...dateCondition };
        }
        break;

      case 'supervisor':
        // Supervisors can access reports related to their team/subordinates.
        const subordinateIds = await User.findAll({ where: { supervisorId: userId }, attributes: ['id'] }).map(user => user.id);

         whereCondition[Op.or] = [
            { createdBy: { [Op.in]: subordinateIds } },
            // Add conditions here to filter reports based on parameters field if they are relevant to the supervisor's scope
             // Example: if report parameters include a userId, check if it's in subordinateIds
            // { parameters: { userId: { [Op.in]: subordinateIds } } } // Requires JSONB or similar for complex queries
        ];

         // Apply filters that supervisors are allowed to use (usually relevant to their subordinates)
         if (departmentId) {
             // Filter by department of the creator (if a subordinate) or users mentioned in report parameters
             // Requires complex logic based on how department is stored/used in report parameters
             // For simplicity, let's assume filtering by the creator's department for now, if the creator is a subordinate.
             includeOptions[0].where = { ...includeOptions[0].where, departmentId: departmentId, id: {[Op.in]: subordinateIds} };
         }
         if (role) {
              // Filter by role of the creator (if a subordinate) or users mentioned in report parameters
               // For simplicity, let's assume filtering by the creator's role for now, if the creator is a subordinate.
              includeOptions[0].where = { ...includeOptions[0].where, role: role, id: {[Op.in]: subordinateIds} };
         }
         if (programType) {
               // Filter by program type of the creator (if a subordinate) or users mentioned in report parameters
               // For simplicity, let's assume filtering by the creator's program type for now, if the creator is a subordinate.
              includeOptions[0].where = { ...includeOptions[0].where, programType: programType, id: {[Op.in]: subordinateIds} };
         }

         if (timePeriod) {
            const dateCondition = buildDateRangeCondition(timePeriod);
            if(dateCondition) whereCondition.createdAt = { ...whereCondition.createdAt, ...dateCondition };
        }
        break;

      case 'employee':
        // Employees can only access their own reports
        whereCondition.createdBy = userId;
         if (timePeriod) {
            const dateCondition = buildDateRangeCondition(timePeriod);
            if(dateCondition) whereCondition.createdAt = { ...whereCondition.createdAt, ...dateCondition };
        }
        // Employee role cannot apply other filters like department, role, programType
        break;

      default:
        // Roles with no specific report access
        return res.status(403).json({ message: 'Unauthorized to access reports.' });
    }

     // Apply date range filtering if timePeriod is provided and not handled by role switch
    // Note: This is a fallback in case timePeriod was not handled explicitly in the role switch.
    // The logic inside the role switch is more specific and will take precedence.
     if (timePeriod && !whereCondition.createdAt) {
         const dateCondition = buildDateRangeCondition(timePeriod);
         if(dateCondition) whereCondition.createdAt = dateCondition;
     }

    const reports = await Report.findAll({
      where: whereCondition,
      include: includeOptions,
    });

    // Prepare data for export
    const reportData = reports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      type: report.type,
      parameters: report.parameters, // This is a JSON object/string
      createdBy: report.createdBy, // User ID
      creatorName: report.creator ? report.creator.name : null, // Creator's name if included
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));

    switch (format.toLowerCase()) {
      case 'csv': {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=custom_report.csv');

        const csvHeaders = ['ID', 'Title', 'Description', 'Type', 'Parameters', 'Created By (ID)', 'Created By (Name)', 'Created At', 'Updated At'];
        const csvRows = [csvHeaders.join(',')];

        reportData.forEach(row => {
          csvRows.push([
            row.id,
            `"${row.title.replace(/"/g, '""')}"`,
            `"${row.description ? row.description.replace(/"/g, '""') : ''}"`,
            row.type,
            `"${JSON.stringify(row.parameters).replace(/"/g, '""')}"`, // Stringify JSON and escape quotes
            row.createdBy,
            row.creatorName || '',
            row.createdAt ? new Date(row.createdAt).toISOString() : '',
            row.updatedAt ? new Date(row.updatedAt).toISOString() : '',
          ].join(','));
        });

        return res.status(200).send(csvRows.join('\n'));
      }

      case 'excel': {
        try {
          const wb = XLSX.utils.book_new();
          const ws_data = [];

          const excelHeaders = ['ID', 'Title', 'Description', 'Type', 'Parameters', 'Created By (ID)', 'Created By (Name)', 'Created At', 'Updated At'];
          ws_data.push(excelHeaders);

          reportData.forEach(row => {
            ws_data.push([
              row.id,
              row.title,
              row.description || '',
              row.type,
              JSON.stringify(row.parameters), // Include parameters as string
              row.createdBy,
              row.creatorName || '',
              row.createdAt ? new Date(row.createdAt).toISOString() : '',
              row.updatedAt ? new Date(row.updatedAt).toISOString() : '',
            ]);
          });

          const ws = XLSX.utils.aoa_to_sheet(ws_data);
          XLSX.utils.book_append_sheet(wb, ws, 'Custom Report');

          const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', bookSST: false });

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=custom_report.xlsx');
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
          res.setHeader('Content-Disposition', 'attachment; filename=custom_report.pdf');
          doc.pipe(res);

          doc.fontSize(16).text('Custom Report', { align: 'center' });
          doc.moveDown();

          reportData.forEach(item => {
            doc.fontSize(12).text(`Title: ${item.title}`);
            doc.text(`Type: ${item.type}`);
            doc.text(`Description: ${item.description || ''}`);
            doc.text(`Parameters: ${JSON.stringify(item.parameters)}`);
            doc.text(`Created By: ${item.creatorName || item.createdBy}`);
            doc.text(`Created At: ${item.createdAt}`);
            doc.moveDown(0.5);
          });

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
    console.error('Error exporting custom report:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  exportCustomReport,
}; 