const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Survey = sequelize.define(
  "Survey",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "3-month",
        "6-month",
        "12-month",
        "training",
        "general"
      ),
      defaultValue: "general",
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "completed"),
      defaultValue: "draft",
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    targetRole: {
      type: DataTypes.ENUM("employee", "supervisor", "manager", "hr", "all"),
      defaultValue: "employee",
      allowNull: true,
    },
    targetProgram: {
      type: DataTypes.ENUM(
        "inkompass",
        "earlyTalent",
        "apprenticeship",
        "academicPlacement",
        "workExperience",
        "all"
      ),
      defaultValue: "all",
      allowNull: true,
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'surveys',
    timestamps: true,
  }
);

// Define associations
Survey.associate = (models) => {
  Survey.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  Survey.hasMany(models.SurveyQuestion, {
    foreignKey: 'surveyId',
    as: 'questions'
  });
  Survey.hasMany(models.SurveyResponse, {
    foreignKey: 'surveyId',
    as: 'responses'
  });
};

module.exports = Survey;
