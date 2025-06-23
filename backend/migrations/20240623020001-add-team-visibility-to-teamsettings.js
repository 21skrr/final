'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('teamsettings', 'teamVisibility', {
      type: Sequelize.ENUM("all", "direct_reports"),
      defaultValue: "direct_reports",
      after: 'coachingAlertsEnabled'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('teamsettings', 'teamVisibility');
  }
}; 