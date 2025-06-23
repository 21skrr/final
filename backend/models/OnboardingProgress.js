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
      type: DataTypes.ENUM("prepare", "orient", "land", "integrate", "excel"),
      allowNull: false,
      defaultValue: "prepare",
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
  },
  {
    tableName: "onboardingprogresses",
    timestamps: true,
  }
);

module.exports = OnboardingProgress;
