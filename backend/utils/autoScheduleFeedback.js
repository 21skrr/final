const { Feedback } = require("../models");
const { getSystemSetting } = require("./systemSettingsService");

/**
 * Auto-schedules feedback entries for a user based on feedbackCycles.
 * @param {Object} user - Sequelize user instance
 */
const scheduleFeedbackCyclesForUser = async (user) => {
  const feedbackCycles = await getSystemSetting("feedbackCycles");

  if (!Array.isArray(feedbackCycles)) return;

  for (const months of feedbackCycles) {
    const scheduledDate = new Date(user.startDate);
    scheduledDate.setMonth(scheduledDate.getMonth() + months);

    await Feedback.create({
      fromUserId: null, // system generated
      toUserId: user.id,
      toDepartment: user.department,
      type: "automated-cycle",
      message: `Automated ${months}-month feedback cycle scheduled.`,
      isAnonymous: false,
      createdAt: scheduledDate,
    });
  }
};

module.exports = scheduleFeedbackCyclesForUser;
