const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define(
    'Report', // Model name
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
        type: DataTypes.ENUM('onboarding', 'performance', 'training', 'feedback', 'custom'), // Based on schema
        allowNull: false,
      },
      parameters: {
        type: DataTypes.JSON,
        allowNull: true, // Based on schema
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'createdBy', // Based on schema
        references: {
          model: 'users', // Assuming your users table is named 'users'
          key: 'id',
        },
      },
    },
    {
      tableName: 'reports', // Database table name
      timestamps: true, // Uses createdAt and updatedAt
      underscored: false, // Maps field names to snake_case columns
    }
  );

  // Define association with User model (for createdBy)
  Report.associate = (models) => {
    Report.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return Report;
}; 