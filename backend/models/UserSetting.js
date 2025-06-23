const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserSetting = sequelize.define(
    "UserSetting",
    {
        id: {
            type: DataTypes.CHAR(36),
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4, // ✅ auto-generate UUID
          },
          
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      pushNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      profileVisibility: {
        type: DataTypes.ENUM("public", "private", "team"),
        defaultValue: "team",
      },
      activityStatus: {
        type: DataTypes.ENUM("online", "away", "offline"),
        defaultValue: "offline",
      },
      theme: {
        type: DataTypes.ENUM("light", "dark", "system"),
        defaultValue: "system",
      },
      compactMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notificationFrequency: {
        type: DataTypes.ENUM("daily", "weekly", "immediate"),
        defaultValue: "daily",
      },
      dashboardLayout: {
        type: DataTypes.ENUM("compact", "detailed"),
        defaultValue: "detailed",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "usersettings",
      timestamps: true,
    }
  );

  UserSetting.associate = (models) => {
    UserSetting.belongsTo(models.User, {
      foreignKey: "userId",
      as: "User",
    });
  };

  return UserSetting;
}; 