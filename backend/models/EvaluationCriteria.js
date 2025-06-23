const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EvaluationCriteria = sequelize.define(
  "EvaluationCriteria",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    evaluationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Evaluations",
        key: "id",
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    criteria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove association to EvaluationCriteria as it's part of the same model concept
// EvaluationCriteria.associate = (models) => {
//   EvaluationCriteria.belongsTo(models.Evaluation, {
//     foreignKey: "evaluationId",
//   });
// };

module.exports = EvaluationCriteria;
