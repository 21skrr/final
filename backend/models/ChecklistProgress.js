const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChecklistProgress = sequelize.define(
  "ChecklistProgress",
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
    checklistItemId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "ChecklistItems",
        key: "id",
      },
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    periodKey: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'e.g. 2026-04-29 (daily), 2026-W17 (weekly), 2026-04 (monthly), NULL for one-time',
    },
  },
  {
    timestamps: true,
    tableName: "checklistprogresses"
  }
);

module.exports = ChecklistProgress; 