const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SurveySchedule extends Model {
    static associate(models) {
      // Define association with Survey model
      SurveySchedule.belongsTo(models.Survey, {
        foreignKey: 'surveyId',
        as: 'survey'
      });
    }
  }

  SurveySchedule.init({
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    surveyId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id'
      }
    },
    scheduleType: {
      type: DataTypes.ENUM('one-time', 'recurring'),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    frequency: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    targetAudience: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SurveySchedule',
    tableName: 'survey_schedules',
    timestamps: true
  });

  return SurveySchedule;
}; 