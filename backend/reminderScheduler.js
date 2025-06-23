const cron = require("node-cron");
const { User, Notification, Feedback } = require("./models");
const { Op } = require("sequelize");

// Helper: Calculate months between two dates
function monthsBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d2.getFullYear() * 12 +
    d2.getMonth() -
    (d1.getFullYear() * 12 + d1.getMonth())
  );
}

// Feedback reminder logic
async function sendFeedbackReminders() {
  const users = await User.findAll({ where: { role: "employee" } });
  const today = new Date();
  for (const user of users) {
    if (!user.startDate) continue;
    const months = monthsBetween(user.startDate, today);
    let dueType = null;
    if (months === 3) dueType = "3-month";
    if (months === 6) dueType = "6-month";
    if (months === 12) dueType = "12-month";
    if (!dueType) continue;
    // Check if feedback already exists
    const existing = await Feedback.findOne({
      where: { employeeId: user.id, type: dueType },
    });
    if (!existing) {
      await Notification.create({
        userId: user.id,
        type: "feedback",
        message: `Please complete your ${dueType} feedback survey.`,
      });
    }
  }
}

// Trial period reminder logic (assume 3-month trial)
async function sendTrialReminders() {
  const users = await User.findAll({ where: { role: "employee" } });
  const today = new Date();
  for (const user of users) {
    if (!user.startDate) continue;
    const trialEnd = new Date(user.startDate);
    trialEnd.setMonth(trialEnd.getMonth() + 3);
    const diffDays = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 7) {
      // Notify HR and manager
      const hrUsers = await User.findAll({ where: { role: "rh" } });
      const manager = user.managerId
        ? await User.findByPk(user.managerId)
        : null;
      for (const hr of hrUsers) {
        await Notification.create({
          userId: hr.id,
          type: "trial",
          message: `Trial period for ${user.name} ends in 1 week.`,
        });
      }
      if (manager) {
        await Notification.create({
          userId: manager.id,
          type: "trial",
          message: `Trial period for ${user.name} ends in 1 week.`,
        });
      }
    }
  }
}

// Schedule: run every day at 7am
cron.schedule("0 7 * * *", async () => {
  await sendFeedbackReminders();
  await sendTrialReminders();
  console.log("Automated reminders sent.");
});

module.exports = {};
