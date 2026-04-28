'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Evaluations', 'employeeComment', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      after: 'comments',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Evaluations', 'employeeComment');
  },
};
