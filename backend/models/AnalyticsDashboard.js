const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AnalyticsDashboard = sequelize.define(
  "analytics_dashboards",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    role_access: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'analytics_dashboards',
    timestamps: true,
    underscored: true
  }
);

module.exports = AnalyticsDashboard; 