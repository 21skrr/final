'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add hrValidated field to OnboardingTasks table
    await queryInterface.addColumn('OnboardingTasks', 'hrValidated', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    // Add completed field to OnboardingTasks table if it doesn't exist
    await queryInterface.addColumn('OnboardingTasks', 'completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn('OnboardingTasks', 'hrValidated');
    await queryInterface.removeColumn('OnboardingTasks', 'completed');
  }
};
