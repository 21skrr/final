'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new notification types to the ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE \`Notifications\` 
      MODIFY COLUMN \`type\` ENUM(
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
        'evaluation_overdue',
        'supervisor_assessment_required',
        'assessment_pending',
        'supervisor_assessment_pending'
      ) NOT NULL DEFAULT 'system'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new notification types from the ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE \`Notifications\` 
      MODIFY COLUMN \`type\` ENUM(
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
  }
}; 