'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add hrValidated field to UserTaskProgress table
    await queryInterface.addColumn('usertaskprogresses', 'hrValidated', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    // Add hrValidatedAt field to UserTaskProgress table
    await queryInterface.addColumn('usertaskprogresses', 'hrValidatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    // Add hrComments field to UserTaskProgress table
    await queryInterface.addColumn('usertaskprogresses', 'hrComments', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn('usertaskprogresses', 'hrValidated');
    await queryInterface.removeColumn('usertaskprogresses', 'hrValidatedAt');
    await queryInterface.removeColumn('usertaskprogresses', 'hrComments');
  }
};
