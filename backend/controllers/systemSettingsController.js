const systemSettingsService = require('../utils/systemSettingsService');
const { restartEvaluationSchedulers } = require('../server');

const getSettings = async (req, res) => {
  try {
    const settings = await systemSettingsService.getAllSystemSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message, details: error });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updatedSettings = await systemSettingsService.updateSystemSettings(req.body, req.user.id);
    // If any cron setting was updated, restart the schedulers
    if (req.body.evaluationAutomationCron_3month || req.body.evaluationAutomationCron_6month || req.body.evaluationAutomationCron_12month) {
      await restartEvaluationSchedulers();
    }
    res.json({ message: 'System settings updated successfully.', settings: updatedSettings });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Failed to update system settings.' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
}; 