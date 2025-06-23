const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AnalyticsMetric = sequelize.define(
  "analytics_metrics",
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
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    calculation_method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    is_custom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'analytics_metrics',
    timestamps: true,
    underscored: true
  }
);

module.exports = AnalyticsMetric; 