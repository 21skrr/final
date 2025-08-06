'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('supervisorassessments', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      OnboardingProgressId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'OnboardingProgresses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      UserId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      SupervisorId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Certificate upload
      certificateFile: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      certificateUploadDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Assessment details
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
      // Supervisor decision
      supervisorDecision: {
        type: Sequelize.ENUM("proceed_to_phase_2", "terminate", "put_on_hold"),
        allowNull: true,
      },
      supervisorComments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      decisionDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // HR validation
      hrValidated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hrValidatorId: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      hrValidationDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      hrValidationComments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Status tracking
      status: {
        type: Sequelize.ENUM("pending_certificate", "certificate_uploaded", "assessment_pending", "assessment_completed", "decision_pending", "decision_made", "hr_validation_pending", "hr_validated", "completed"),
        allowNull: false,
        defaultValue: "pending_certificate",
      },
      // Timestamps for workflow tracking
      phase1CompletedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assessmentRequestedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('supervisorassessments', ['OnboardingProgressId']);
    await queryInterface.addIndex('supervisorassessments', ['UserId']);
    await queryInterface.addIndex('supervisorassessments', ['SupervisorId']);
    await queryInterface.addIndex('supervisorassessments', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('supervisorassessments');
  }
}; 