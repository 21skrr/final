const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SurveyQuestion = sequelize.define(
  "SurveyQuestion",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    surveyId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "surveys",
        key: "id",
      },
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("text", "multiple_choice", "rating"),
      allowNull: false,
    },
    required: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },
    options: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    questionOrder: {
      type: DataTypes.INTEGER,
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
  },
  {
    tableName: 'surveyquestions',
    timestamps: true,
  }
);

// Define associations
SurveyQuestion.associate = (models) => {
  SurveyQuestion.belongsTo(models.Survey, {
    foreignKey: 'surveyId',
    as: 'survey'
  });
};

module.exports = SurveyQuestion;
