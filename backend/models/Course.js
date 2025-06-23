const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define(
  "Course",
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
    totalModules: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
      defaultValue: "all",
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Course;
