"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove hrValidated field migration
    // Only add completed field to OnboardingTasks table if it doesn't exist
    await queryInterface.addColumn("OnboardingTasks", "completed", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Only remove completed column
    await queryInterface.removeColumn("OnboardingTasks", "completed");
  },
};
