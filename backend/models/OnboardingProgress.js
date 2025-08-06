// models/OnboardingProgress.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OnboardingProgress = sequelize.define(
  "OnboardingProgress",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    UserId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    stage: {
      type: DataTypes.ENUM("pre_onboarding", "phase_1", "phase_2"),
      allowNull: false,
      defaultValue: "pre_onboarding",
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stageStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estimatedCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "overdue"),
      allowNull: false,
      defaultValue: "pending",
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assessmentPdfUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    assessmentAnswers: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assessmentStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    assessmentReviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    orientProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    landProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    integrateProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    excelProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    orientStatus: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "on_hold", "approved"),
      allowNull: false,
      defaultValue: "pending",
    },
    landStatus: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "on_hold", "approved"),
      allowNull: false,
      defaultValue: "pending",
    },
    integrateStatus: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "on_hold", "approved"),
      allowNull: false,
      defaultValue: "pending",
    },
    excelStatus: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "on_hold", "approved"),
      allowNull: false,
      defaultValue: "pending",
    },
    certificateFile: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    journeyType: {
      type: DataTypes.ENUM("SFP", "CC"),
      allowNull: false,
      defaultValue: "SFP",
    },
  },
  {
    tableName: "onboardingprogresses",
    timestamps: true,
  }
);

module.exports = OnboardingProgress;
