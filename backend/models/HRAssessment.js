// models/HRAssessment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HRAssessment = sequelize.define(
  "HRAssessment",
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
    HRId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
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
    // HR decision
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
    // Status tracking
    status: {
      type: DataTypes.ENUM("pending_assessment", "assessment_completed", "decision_pending", "decision_made", "completed"),
      allowNull: false,
      defaultValue: "pending_assessment",
    },
    // Timestamps for workflow tracking
    phase2CompletedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assessmentRequestedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "hrassessments",
    timestamps: true,
  }
);

module.exports = HRAssessment; 