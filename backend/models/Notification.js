const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "task", 
        "event", 
        "evaluation", 
        "feedback", 
        "system", 
        "weekly_report",
        "reminder",
        "document",
        "training",
        "coaching_session",
        "team_progress",
        "team_followup",
        "probation_deadline",
        "system_alert",
        "new_employee",
        "compliance_alert",
        "feedback_available",
        "feedback_submission",
        "evaluation_reminder",
        "evaluation_overdue"
      ),
      allowNull: false,
      defaultValue: "system",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Notification;

