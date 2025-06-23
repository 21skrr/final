module.exports = (sequelize, DataTypes) => {
  const NotificationPreference = sequelize.define(
    "notification_preferences",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      pushNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notificationTypes: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          reminder: true,
          document: true,
          training: true,
          coaching_session: true,
          team_progress: true,
          overdue_task: true,
          feedback_availability: true,
          feedback_submission: true,
          weekly_report: true,
          compliance: true,
          leave_request: true
        },
      },
      quietHours: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          enabled: false,
          start: "22:00",
          end: "06:00",
          timezone: "UTC"
        },
      },
    },
    {
      tableName: 'notification_preferences',
      timestamps: true,
    }
  );

  NotificationPreference.associate = (models) => {
    NotificationPreference.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return NotificationPreference;
}; 