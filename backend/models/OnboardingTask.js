const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OnboardingTask = sequelize.define(
  "OnboardingTask",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stage: {
      type: DataTypes.ENUM("pre_onboarding", "phase_1", "phase_2"),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    controlledBy: {
      type: DataTypes.ENUM("hr", "employee", "both"),
      allowNull: false,
      defaultValue: "both",
    },
    hrValidated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    journeyType: {
      type: DataTypes.ENUM("SFP", "CC", "both"),
      allowNull: false,
      defaultValue: "both",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = OnboardingTask;
