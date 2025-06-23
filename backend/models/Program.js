const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Program = sequelize.define(
  "Program",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    overview: DataTypes.TEXT,
    components: DataTypes.JSON,
    features: DataTypes.JSON,
    support: DataTypes.JSON,
    benefits: DataTypes.JSON,
    duration: DataTypes.STRING,
    objective: DataTypes.JSON,
    programType: DataTypes.STRING,
    status: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
  },
  {
    timestamps: true,
  }
);

module.exports = Program;
