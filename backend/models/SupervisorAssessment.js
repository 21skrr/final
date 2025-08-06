// models/SupervisorAssessment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SupervisorAssessment = sequelize.define(
  "SupervisorAssessment",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    OnboardingProgressId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'OnboardingProgresses',
        key: 'id'
      }
    },
    UserId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    SupervisorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    // Certificate upload
    certificateFile: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    certificateUploadDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Assessment details
    assessmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assessmentNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assessmentScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    // Supervisor decision
    supervisorDecision: {
      type: DataTypes.ENUM("proceed_to_phase_2", "terminate", "put_on_hold"),
      allowNull: true,
    },
    supervisorComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    decisionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // HR validation
    hrValidated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hrValidatorId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    hrValidationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hrValidationComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Status tracking
    status: {
      type: DataTypes.ENUM("pending_certificate", "certificate_uploaded", "assessment_pending", "assessment_completed", "decision_pending", "decision_made", "hr_approval_pending", "hr_approved", "hr_rejected", "completed"),
      allowNull: false,
      defaultValue: "pending_certificate",
    },
    // HR decision fields
    hrDecision: {
      type: DataTypes.ENUM("approve", "reject", "request_changes"),
      allowNull: true,
    },
    hrDecisionComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hrDecisionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Timestamps for workflow tracking
    phase1CompletedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assessmentRequestedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "supervisorassessments",
    timestamps: true,
  }
);

module.exports = SupervisorAssessment; 