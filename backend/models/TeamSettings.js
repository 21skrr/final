const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TeamSetting = sequelize.define(
    "TeamSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      teamId: {
        type: DataTypes.INTEGER, // Assuming Team ID is INTEGER based on Team model
        allowNull: false,
        references: {
          model: "teams", // Make sure this matches your actual teams table name
          key: "id",
        },
      },
      reportFilters: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      coachingAlertsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      }, 
           teamVisibility: {
        type: DataTypes.ENUM("all", "direct_reports"),
        defaultValue: "direct_reports",
      },
    },
    {
      tableName: "teamsettings", // You can adjust the table name if needed
      timestamps: true,
    }
  );

  TeamSetting.associate = (models) => {
    TeamSetting.belongsTo(models.Team, {
      foreignKey: "teamId",
      as: "team",
    });
  };

  return TeamSetting;
}; 