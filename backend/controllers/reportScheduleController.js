const { ReportSchedule } = require('../models');

// POST /api/reports/schedule
const createReportSchedule = async (req, res) => {
  try {
    const { template_id, name, frequency, config, recipients } = req.body;

    // Basic validation (adjust required fields based on your needs)
    if (!name || !frequency || !config || !recipients) {
      return res.status(400).json({ message: 'Missing required fields for scheduling a report.' });
    }

    const newSchedule = await ReportSchedule.create({
      template_id,
      name,
      frequency,
      config,
      recipients, // Ensure recipients is in the correct format (JSON array)
      // status will default to 'active' based on schema
      // created_by can be added here if needed from req.user.id
    });

    res.status(201).json({
      message: 'Report schedule created successfully',
      schedule: newSchedule,
    });

  } catch (error) {
    console.error('Error creating report schedule:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// PUT /api/reports/schedule/:id
const updateReportSchedule = async (req, res) => {
  try {
    const { id } = req.params; // Get schedule ID from URL
    const { template_id, name, frequency, config, recipients, status } = req.body; // Get updated fields from body

    // Find the schedule by ID
    const schedule = await ReportSchedule.findByPk(id);

    // If schedule not found
    if (!schedule) {
      return res.status(404).json({ message: 'Report schedule not found.' });
    }

    // Update schedule fields (only update if the field is provided in the body)
    if (template_id !== undefined) schedule.template_id = template_id;
    if (name !== undefined) schedule.name = name;
    if (frequency !== undefined) schedule.frequency = frequency;
    if (config !== undefined) schedule.config = config;
    if (recipients !== undefined) schedule.recipients = recipients;
    if (status !== undefined) schedule.status = status;

    // Save the updated schedule
    await schedule.save();

    res.status(200).json({
      message: 'Report schedule updated successfully',
      schedule: schedule,
    });

  } catch (error) {
    console.error('Error updating report schedule:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// DELETE /api/reports/schedule/:id
const deleteReportSchedule = async (req, res) => {
  try {
    const { id } = req.params; // Get schedule ID from URL

    // Find the schedule by ID
    const schedule = await ReportSchedule.findByPk(id);

    // If schedule not found
    if (!schedule) {
      return res.status(404).json({ message: 'Report schedule not found.' });
    }

    // Delete the schedule
    await schedule.destroy();

    res.status(200).json({ message: 'Report schedule deleted successfully.' });

  } catch (error) {
    console.error('Error deleting report schedule:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createReportSchedule,
  updateReportSchedule,
  deleteReportSchedule,
}; 