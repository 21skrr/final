'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usersettings', 'notificationFrequency', {
      type: Sequelize.ENUM("daily", "weekly", "immediate"),
      defaultValue: "daily",
      after: 'compactMode'
    });

    await queryInterface.addColumn('usersettings', 'dashboardLayout', {
      type: Sequelize.ENUM("compact", "detailed"),
      defaultValue: "detailed",
      after: 'notificationFrequency'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('usersettings', 'notificationFrequency');
    await queryInterface.removeColumn('usersettings', 'dashboardLayout');
  }
}; 