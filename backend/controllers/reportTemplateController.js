const { ReportTemplate } = require('../models');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const getReportTemplates = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const reportTemplates = await ReportTemplate.findAll({});

    // Prepare data for export
    const data = reportTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      // Add other fields from your ReportTemplate model here
    }));

    switch (format.toLowerCase()) {
      case 'csv': {
        const csvHeaders = ['ID', 'Name', 'Description', 'Created At', 'Updated At'];
        const csvRows = [csvHeaders.join(',')];

        data.forEach(row => {
          csvRows.push([
            row.id,
            `"${row.name.replace(/"/g, '""')}"`,
            `"${row.description.replace(/"/g, '""')}"`,
            row.createdAt ? new Date(row.createdAt).toISOString() : '',
            row.updatedAt ? new Date(row.updatedAt).toISOString() : '',
          ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=report_templates.csv');
        return res.status(200).send(csvRows.join('\n'));
      }

      case 'excel': {
        try {
          const wb = XLSX.utils.book_new();
          const ws_data = [];

          const excelHeaders = ['ID', 'Name', 'Description', 'Created At', 'Updated At'];
          ws_data.push(excelHeaders);

          data.forEach(row => {
            ws_data.push([
              row.id,
              row.name,
              row.description,
              row.createdAt ? new Date(row.createdAt).toISOString() : '',
              row.updatedAt ? new Date(row.updatedAt).toISOString() : '',
            ]);
          });

          const ws = XLSX.utils.aoa_to_sheet(ws_data);
          XLSX.utils.book_append_sheet(wb, ws, 'Report Templates');

          const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', bookSST: false });

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=report_templates.xlsx');
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
          res.setHeader('Content-Disposition', 'attachment; filename=report_templates.pdf');

          doc.pipe(res);

          doc.fontSize(16).text('Report Templates', { align: 'center' });
          doc.moveDown();

          data.forEach(template => {
            doc.fontSize(12).text(`Name: ${template.name}`);
            doc.text(`Description: ${template.description}`);
            doc.text(`Created At: ${template.createdAt}`);
            doc.text(`Updated At: ${template.updatedAt}`);
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
        return res.status(200).json(data);
    }

  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

const createReportTemplate = async (req, res) => {
  try {
    const { name, description, configuration, type, is_system_template } = req.body;

    // Basic validation
    if (!name || !type || !configuration) {
      return res.status(400).json({ message: 'Report template name, type, and configuration are required.' });
    }

    const newTemplate = await ReportTemplate.create({
      name,
      description,
      config: configuration,
      type,
      is_system_template: is_system_template || false,
      // created_by will be handled by association or can be added here if needed from req.user.id
    });

    res.status(201).json({
      message: 'Report template created successfully',
      template: newTemplate,
    });

  } catch (error) {
    console.error('Error creating report template:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

const updateReportTemplate = async (req, res) => {
  try {
    const { id } = req.params; // Get template ID from URL
    const { name, description, configuration, type, is_system_template } = req.body; // Get updated fields from body

    // Find the template by ID
    const template = await ReportTemplate.findByPk(id);

    // If template not found
    if (!template) {
      return res.status(404).json({ message: 'Report template not found.' });
    }

    // Update template fields (only update if the field is provided in the body)
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (type !== undefined) template.type = type;
    if (configuration !== undefined) template.config = configuration; // Map to 'config'
    if (is_system_template !== undefined) template.is_system_template = is_system_template;

    // Save the updated template
    await template.save();

    res.status(200).json({
      message: 'Report template updated successfully',
      template: template,
    });

  } catch (error) {
    console.error('Error updating report template:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

const deleteReportTemplate = async (req, res) => {
  try {
    const { id } = req.params; // Get template ID from URL

    // Find the template by ID
    const template = await ReportTemplate.findByPk(id);

    // If template not found
    if (!template) {
      return res.status(404).json({ message: 'Report template not found.' });
    }

    // Delete the template
    await template.destroy();

    res.status(200).json({ message: 'Report template deleted successfully.' });

  } catch (error) {
    console.error('Error deleting report template:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getReportTemplates,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
}; 