const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReportTemplate = sequelize.define(
    'ReportTemplate', // Model name
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false, // Corrected based on schema
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true, // Corrected based on schema
        references: {
          model: 'users', // Assuming your users table is named 'users'
          key: 'id',
        },
      },
      is_system_template: {
        type: DataTypes.BOOLEAN,
        allowNull: true, // Corrected based on schema
        defaultValue: false, // Corrected based on schema (0 in tinyint)
      },
    },
    {
      tableName: 'report_templates', // Database table name
      timestamps: true, // Uses createdAt and updatedAt
      underscored: true, // Maps field names to snake_case columns
    }
  );

  // Define association with User model
  ReportTemplate.associate = (models) => {
    ReportTemplate.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return ReportTemplate;
}; 