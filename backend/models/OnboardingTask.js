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
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stage: {
      type: DataTypes.ENUM("prepare", "orient", "land", "integrate", "excel"),
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
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = OnboardingTask;
