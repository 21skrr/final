'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the ENUM type to include new status values
    await queryInterface.sequelize.query(`
      ALTER TABLE "Evaluations" 
      ALTER COLUMN "status" TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Evaluations" 
      ALTER COLUMN "status" TYPE VARCHAR(255) 
      CHECK ("status" IN ('pending', 'in_progress', 'completed', 'validated', 'draft'));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE "Evaluations" 
      ALTER COLUMN "status" TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Evaluations" 
      ALTER COLUMN "status" TYPE VARCHAR(255) 
      CHECK ("status" IN ('pending', 'in_progress', 'completed'));
    `);
  }
};
