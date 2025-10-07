const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Evaluation = sequelize.define(
  "Evaluation",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employeeId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "3-month",
        "6-month",
        "12-month",
        "performance",
        "training",
        "probation"
      ),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "validated", "draft"),
      allowNull: false,
      defaultValue: "pending",
    },
    overallScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Evaluation;
