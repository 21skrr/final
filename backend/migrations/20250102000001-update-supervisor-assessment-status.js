'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the status enum to include HR approval statuses
    await queryInterface.changeColumn('supervisorassessments', 'status', {
      type: Sequelize.ENUM(
        "pending_certificate", 
        "certificate_uploaded", 
        "assessment_pending", 
        "assessment_completed", 
        "decision_pending", 
        "decision_made", 
        "hr_approval_pending", 
        "hr_approved", 
        "hr_rejected", 
        "completed"
      ),
      allowNull: false,
      defaultValue: "pending_certificate",
    });

    // Add HR decision field
    await queryInterface.addColumn('supervisorassessments', 'hrDecision', {
      type: Sequelize.ENUM("approve", "reject", "request_changes"),
      allowNull: true,
    });

    // Add HR decision comments field
    await queryInterface.addColumn('supervisorassessments', 'hrDecisionComments', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add HR decision date field
    await queryInterface.addColumn('supervisorassessments', 'hrDecisionDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the status enum
    await queryInterface.changeColumn('supervisorassessments', 'status', {
      type: Sequelize.ENUM(
        "pending_certificate", 
        "certificate_uploaded", 
        "assessment_pending", 
        "assessment_completed", 
        "decision_pending", 
        "decision_made", 
        "hr_validation_pending", 
        "hr_validated", 
        "completed"
      ),
      allowNull: false,
      defaultValue: "pending_certificate",
    });

    // Remove HR decision fields
    await queryInterface.removeColumn('supervisorassessments', 'hrDecision');
    await queryInterface.removeColumn('supervisorassessments', 'hrDecisionComments');
    await queryInterface.removeColumn('supervisorassessments', 'hrDecisionDate');
  }
}; 