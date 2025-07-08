const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChecklistCombined = sequelize.define(
  "ChecklistCombined",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    checklistId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    assignedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
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
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignmentCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignmentUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    programType: {
      type: DataTypes.ENUM("inkompass", "earlyTalent", "apprenticeship", "academicPlacement", "workExperience", "all"),
      defaultValue: "all",
    },
    stage: {
      type: DataTypes.ENUM("prepare", "orient", "land", "integrate", "excel", "all"),
      defaultValue: "all",
    },
    checklistCreatedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    checklistCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checklistUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    autoAssign: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    requiresVerification: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    dueInDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "checklist_combined",
  }
);

module.exports = ChecklistCombined;
