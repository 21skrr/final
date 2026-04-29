/**
 * Migration: Add system_alert (and other missing types) to Notifications.type ENUM
 * Preserves all existing ENUM values to avoid data truncation.
 * Run: node scripts/fix-notification-enum.js
 */
const sequelize = require('../config/database');

async function run() {
  try {
    const [rows] = await sequelize.query("SHOW COLUMNS FROM `Notifications` LIKE 'type'");
    console.log('Current type ENUM:', rows[0].Type);

    // Include ALL existing values + all values the model expects + new ones
    await sequelize.query(`
      ALTER TABLE \`Notifications\`
      MODIFY COLUMN \`type\` ENUM(
        'reminder',
        'document',
        'training',
        'coaching_session',
        'team_progress',
        'overdue_task',
        'feedback_availability',
        'feedback_submission',
        'weekly_report',
        'compliance',
        'leave_request',
        'info',
        'warning',
        'success',
        'error',
        'evaluation_reminder',
        'evaluation_overdue',
        'task',
        'event',
        'evaluation',
        'feedback',
        'system',
        'team_followup',
        'probation_deadline',
        'system_alert',
        'new_employee',
        'compliance_alert',
        'feedback_available',
        'assessment_pending'
      ) NOT NULL DEFAULT 'system_alert'
    `);

    const [after] = await sequelize.query("SHOW COLUMNS FROM `Notifications` LIKE 'type'");
    console.log('\nUpdated type ENUM:', after[0].Type);
    console.log('\nDone! system_alert is now valid.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
