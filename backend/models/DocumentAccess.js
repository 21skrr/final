const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DocumentAccess = sequelize.define(
  "DocumentAccess",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Documents",
        key: "id",
      },
    },
    roleAccess: {
      type: DataTypes.ENUM("employee", "supervisor", "manager", "hr", "all"),
      allowNull: false,
      defaultValue: "all",
    },
    programAccess: {
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
    departmentAccess: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = DocumentAccess;
