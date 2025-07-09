'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the new ENUM values to the type column
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM(
        'task', 
        'event', 
        'evaluation', 
        'feedback', 
        'system', 
        'weekly_report',
        'reminder',
        'document',
        'training',
        'coaching_session',
        'team_progress',
        'team_followup',
        'probation_deadline',
        'system_alert',
        'new_employee',
        'compliance_alert',
        'feedback_available',
        'feedback_submission',
        'evaluation_reminder',
        'evaluation_overdue'
      ) NOT NULL DEFAULT 'system'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new ENUM values (revert to original)
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM(
        'task', 
        'event', 
        'evaluation', 
        'feedback', 
        'system', 
        'weekly_report',
        'reminder',
        'document',
        'training',
        'coaching_session',
        'team_progress',
        'team_followup',
        'probation_deadline',
        'system_alert',
        'new_employee',
        'compliance_alert',
        'feedback_available',
        'feedback_submission'
      ) NOT NULL DEFAULT 'system'
    `);
  }
}; 