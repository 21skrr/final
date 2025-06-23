const { sequelize, SurveyResponse, SurveyQuestionResponse } = require('../models');

const resetSurveyResponses = async () => {
  console.log('Starting to reset survey responses...');
  const transaction = await sequelize.transaction();

  try {
    // Temporarily disable foreign key checks to allow truncation.
    // Note: This syntax is for MySQL.
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    console.log('Truncating SurveyQuestionResponse table...');
    await SurveyQuestionResponse.destroy({ where: {}, truncate: true, transaction });

    console.log('Truncating SurveyResponse table...');
    await SurveyResponse.destroy({ where: {}, truncate: true, transaction });

    // Re-enable foreign key checks.
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

    await transaction.commit();
    console.log('✅ Successfully deleted all survey responses.');
    console.log('You can now re-submit surveys for testing.');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Failed to reset survey responses:', error);
  } finally {
    // Ensure the database connection is closed.
    await sequelize.close();
  }
};

resetSurveyResponses(); 