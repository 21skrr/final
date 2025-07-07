// Migration to update the status ENUM in feedback_notes
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // MySQL: alter ENUM by recreating the column
    await queryInterface.sequelize.query(`
      ALTER TABLE feedback_notes 
      MODIFY COLUMN status ENUM('pending', 'in-progress', 'addressed') DEFAULT 'pending';
    `);
  },
  down: async (queryInterface, Sequelize) => {
    // Revert to previous ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE feedback_notes 
      MODIFY COLUMN status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending';
    `);
  }
}; 