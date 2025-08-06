'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hrassessments', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      OnboardingProgressId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'onboardingprogresses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      UserId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      HRId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assessmentDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assessmentNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      assessmentScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hrDecision: {
        type: Sequelize.ENUM('approve', 'reject', 'request_changes'),
        allowNull: true,
      },
      hrDecisionComments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hrDecisionDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending_assessment', 'assessment_completed', 'decision_pending', 'decision_made', 'completed'),
        allowNull: false,
        defaultValue: 'pending_assessment',
      },
      phase2CompletedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assessmentRequestedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });

    // Add indexes
    await queryInterface.addIndex('hrassessments', ['OnboardingProgressId']);
    await queryInterface.addIndex('hrassessments', ['UserId']);
    await queryInterface.addIndex('hrassessments', ['HRId']);
    await queryInterface.addIndex('hrassessments', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hrassessments');
  }
}; 