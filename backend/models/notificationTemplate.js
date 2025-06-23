module.exports = (sequelize, DataTypes) => {
  const NotificationTemplate = sequelize.define(
    "notificationtemplates",
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'reminder',
          'document',
          'training',
          'coaching_session',
          'team_progress',
          'overdue_task',
          'feedback_availability',
          'feedback_submission',
          'weekly_report',
          'compliance',
          'leave_request'
        ),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdBy: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'notificationtemplates',
      timestamps: true
    }
  );

  NotificationTemplate.associate = (models) => {
    NotificationTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
  };

  return NotificationTemplate;
}; 