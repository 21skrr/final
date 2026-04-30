/**
 * Daily reminder: sends a notification to employees who haven't started their daily checklists.
 * Run via a cron job or call POST /api/checklists/send-daily-reminders
 * Can also be run manually: node scripts/send-daily-checklist-reminders.js
 */
const { User, Checklist, ChecklistCombined, ChecklistItem, ChecklistProgress, Notification } = require('../models');
const { Op } = require('sequelize');
const { sendNotification } = require('../utils/notificationHelper');

async function sendDailyReminders() {
  const today = new Date().toISOString().slice(0, 10); // "2026-04-29"
  console.log(`=== Sending daily checklist reminders for ${today} ===\n`);

  // Find all assignments where frequency = 'daily' and has an employee user
  const [dailyRows] = await require('../config/database').query(`
    SELECT cc.userId, cc.checklistId, cc.title
    FROM checklist_combined cc
    JOIN Checklists c ON cc.checklistId = c.id
    WHERE c.frequency = 'daily'
      AND cc.userId IS NOT NULL
  `);

  console.log(`Found ${dailyRows.length} daily assignments`);
  let notified = 0;

  for (const row of dailyRows) {
    // Get items for this checklist
    const items = await ChecklistItem.findAll({ where: { checklistId: row.checklistId }, attributes: ['id'] });
    if (items.length === 0) continue;

    const itemIds = items.map(i => i.id);

    // Check if user has completed any item today
    const completedToday = await ChecklistProgress.count({
      where: {
        userId: row.userId,
        checklistItemId: { [Op.in]: itemIds },
        isCompleted: true,
        periodKey: today,
      },
    });

    if (completedToday === 0) {
      // Haven't started today — check if we already sent reminder today
      const alreadySent = await Notification.findOne({
        where: {
          userId: row.userId,
          title: 'Daily Checklist Reminder',
          type: 'system_alert',
          createdAt: { [Op.gte]: new Date(today) },
        },
      });

      if (!alreadySent) {
        await sendNotification({
          userId: row.userId,
          type: 'system_alert',
          title: 'Daily Checklist Reminder',
          message: `Don't forget to complete your daily checklist: "${row.title}"`,
          metadata: { checklistId: row.checklistId },
        });
        notified++;
        console.log(`  Notified user ${row.userId} about "${row.title}"`);
      }
    }
  }

  console.log(`\n=== Done. Sent ${notified} reminder(s) ===`);
}

// If run directly
if (require.main === module) {
  sendDailyReminders()
    .then(() => process.exit(0))
    .catch(e => { console.error(e.message); process.exit(1); });
}

module.exports = { sendDailyReminders };
