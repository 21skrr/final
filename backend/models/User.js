const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const crypto = require("crypto");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('employee', 'supervisor', 'manager', 'hr'),
      allowNull: false
    },
    department: DataTypes.STRING,
    startDate: DataTypes.DATE,
    programType: DataTypes.ENUM('inkompass', 'earlyTalent', 'apprenticeship', 'academicPlacement', 'workExperience'),
    supervisorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    tableName: "users",
    modelName: "User",
    timestamps: true,
    paranoid: true // This enables soft deletes automatically
  }
);

User.associate = (models) => {
  User.belongsTo(models.User, {
    as: 'supervisor',
    foreignKey: 'supervisorId'
  });

  User.hasMany(models.User, {
    as: 'subordinates',
    foreignKey: 'supervisorId'
  });

  User.belongsTo(models.Team, {
    foreignKey: 'teamId'
  });

  User.hasOne(models.OnboardingProgress, {
    foreignKey: 'UserId'
  });

  User.hasMany(models.ChecklistAssignment, {
    foreignKey: 'userId',
    as: 'assignedChecklists'
  });

  User.hasMany(models.Task, {
    foreignKey: 'userId',
    as: 'Tasks'
  });

  User.hasMany(models.FeedbackSubmission, {
    foreignKey: 'submitterId',
    as: 'submittedFeedbacks'
  });

  User.hasMany(models.FeedbackSubmission, {
    foreignKey: 'reviewerId',
    as: 'reviewedFeedbacks'
  });

  // Associate User with FeedbackNote (optional if needed)
  User.hasMany(models.FeedbackNote, {
    foreignKey: 'supervisorId',
    as: 'feedbackNotes'
  });

  // Add association with SurveyResponse
  User.hasMany(models.SurveyResponse, {
    foreignKey: 'userId',
    as: 'surveyResponses'
  });

  // Add association with ActivityLog
  User.hasMany(models.ActivityLog, { foreignKey: 'userId', as: 'ActivityLogs' });
};

User.prototype.checkPassword = function (password) {
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  return hashedPassword === this.passwordHash;
};

module.exports = User;
