const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeedbackForm extends Model {
  static associate(models) {
    FeedbackForm.hasMany(models.FeedbackSubmission, {
      foreignKey: 'formId',
      as: 'submissions'
    });

    FeedbackForm.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}

FeedbackForm.init({
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('3month', '6month', '12month', 'custom'),
    allowNull: false
  },
  description: DataTypes.TEXT,
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  questions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'FeedbackForm',
  tableName: 'FeedbackForms',
  timestamps: true
});

module.exports = FeedbackForm; 