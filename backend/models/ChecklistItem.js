const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChecklistItem = sequelize.define(
  "ChecklistItem",
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    controlledBy: {
      type: DataTypes.ENUM("hr", "supervisor", "employee"),
      defaultValue: "hr",
    },
    phase: {
      type: DataTypes.ENUM("prepare", "orient", "land", "integrate", "excel"),
      defaultValue: "prepare",
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "checklistitems",
  }
);

module.exports = ChecklistItem;
