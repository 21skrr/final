const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeedbackSubmission extends Model {
  static associate(models) {
    // Submission belongs to a form
    FeedbackSubmission.belongsTo(models.FeedbackForm, {
      foreignKey: 'formId',
      as: 'form'
    });

    // Submission belongs to a submitter (user)
    FeedbackSubmission.belongsTo(models.User, {
      foreignKey: 'submitterId',
      as: 'submitter'
    });

    // Submission belongs to a reviewer (user)
    FeedbackSubmission.belongsTo(models.User, {
      foreignKey: 'reviewerId',
      as: 'reviewer'
    });
  }
}

FeedbackSubmission.init({
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  formId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: 'FeedbackForms',
      key: 'id'
    }
  },
  submitterId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'reviewed'),
    defaultValue: 'draft'
  },
  responseData: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  submittedAt: DataTypes.DATE,
  reviewedAt: DataTypes.DATE,
  reviewerId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewComments: DataTypes.TEXT
}, {
  sequelize,
  modelName: 'FeedbackSubmission',
  tableName: 'FeedbackSubmissions',
  timestamps: true
});

module.exports = FeedbackSubmission; 