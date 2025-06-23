const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NotificationSettings = sequelize.define(
  "NotificationSettings",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "onboarding",
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        taskCompletionHR: true,
        taskCompletionEmployee: true,
        stageTransition: true,
        delayAlerts: true,
        newAssignments: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = NotificationSettings;
