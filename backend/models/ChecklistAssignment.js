const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChecklistAssignment = sequelize.define(
  "ChecklistAssignment",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    checklistId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Checklists",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    assignedBy: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("assigned", "in_progress", "completed", "overdue"),
      defaultValue: "assigned",
    },
    completionPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isAutoAssigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "checklistassignments",
  }
);

module.exports = ChecklistAssignment;
