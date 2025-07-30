"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove hrValidated, hrValidatedAt, hrComments fields from UserTaskProgress table
    // No changes needed
  },

  async down(queryInterface, Sequelize) {
    // No changes needed
  },
};
