const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Resource = sequelize.define("Resource", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('document', 'link', 'video', 'other'),
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  stage: {
    type: DataTypes.ENUM('prepare', 'orient', 'land', 'integrate', 'excel', 'all'),
    allowNull: true,
    defaultValue: 'all'
  },
  programType: {
    type: DataTypes.ENUM('inkompass', 'earlyTalent', 'apprenticeship', 'academicPlacement', 'workExperience', 'all'),
    allowNull: true,
    defaultValue: 'all'
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
});

// Optional: Define associations here if Resource has any
// Resource.associate = function(models) {
//   // associations can be defined here
// };

module.exports = Resource; 