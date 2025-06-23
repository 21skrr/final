const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SurveyResponse = sequelize.define(
  "SurveyResponse",
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
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      allowNull: true,
      defaultValue: 'pending'
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
    tableName: 'surveyresponses',
    timestamps: true,
  }
);

// Define associations
SurveyResponse.associate = (models) => {
  SurveyResponse.belongsTo(models.Survey, {
    foreignKey: 'surveyId',
    as: 'survey'
  });
  SurveyResponse.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  SurveyResponse.hasMany(models.SurveyQuestionResponse, {
    foreignKey: 'surveyResponseId',
    as: 'questionResponses'
  });
};

module.exports = SurveyResponse;
