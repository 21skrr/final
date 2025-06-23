const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SurveyQuestionResponse = sequelize.define(
  "SurveyQuestionResponse",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    surveyResponseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "surveyresponses",
        key: "id",
      },
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "surveyquestions",
        key: "id",
      },
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ratingValue: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    selectedOption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'surveyquestionresponses',
    timestamps: true,
  }
);

// Define associations
SurveyQuestionResponse.associate = (models) => {
  SurveyQuestionResponse.belongsTo(models.SurveyResponse, {
    foreignKey: 'surveyResponseId',
    as: 'response'
  });
  SurveyQuestionResponse.belongsTo(models.SurveyQuestion, {
    foreignKey: 'questionId',
    as: 'question'
  });
};

module.exports = SurveyQuestionResponse;
