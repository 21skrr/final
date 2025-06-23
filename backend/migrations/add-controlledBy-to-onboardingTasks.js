'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OnboardingTasks', 'controlledBy', {
      type: Sequelize.ENUM('hr', 'employee', 'both'),
      allowNull: false,
      defaultValue: 'both'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('OnboardingTasks', 'controlledBy');
  }
};