const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SurveySettings = sequelize.define(
  "SurveySettings",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    defaultAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowComments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    requireEvidence: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    autoReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    reminderFrequency: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    responseDeadlineDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 14,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    tableName: 'survey_settings',
    timestamps: true,
  }
);

module.exports = SurveySettings; 