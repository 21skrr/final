const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReportSchedule = sequelize.define(
    'ReportSchedule', // Model name
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      template_id: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      frequency: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      recipients: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      last_run_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      next_run_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'active',
      },
      created_by: {
        type: DataTypes.CHAR(36),
        allowNull: true, // Assuming this links to user ID, but based on schema it's nullable
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'report_schedules', // Database table name
      timestamps: true, // Assuming created_at and updated_at handle timestamps
      underscored: true, // Assuming snake_case in database columns
    }
  );

  // ReportSchedule.associate = (models) => {
  //   // Define associations here if needed, e.g., with User for created_by
  //   ReportSchedule.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  // };

  return ReportSchedule;
}; 