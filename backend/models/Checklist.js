const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Checklist = sequelize.define(
  "Checklist",
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
    programType: {
      type: DataTypes.ENUM(
        "inkompass",
        "earlyTalent",
        "apprenticeship",
        "academicPlacement",
        "workExperience",
        "all"
      ),
      allowNull: false,
      defaultValue: "all",
    },
    stage: {
      type: DataTypes.ENUM(
        "prepare",
        "orient",
        "land",
        "integrate",
        "excel",
        "all"
      ),
      allowNull: false,
      defaultValue: "all",
    },
    createdBy: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    autoAssign: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    requiresVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    dueInDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Checklist;
