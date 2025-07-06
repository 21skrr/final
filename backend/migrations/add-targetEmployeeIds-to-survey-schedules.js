'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('survey_schedules', 'targetEmployeeIds', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of employee IDs to target for this schedule'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('survey_schedules', 'targetEmployeeIds');
  }
}; 