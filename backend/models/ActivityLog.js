const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityLog = sequelize.define("ActivityLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  }
});

// Define associations in an associate method, to be called by models/index.js
ActivityLog.associate = function(models) {
  ActivityLog.belongsTo(models.User, {
    foreignKey: 'userId',
    targetKey: 'id'
  });

  // Fixed: Removed invalid scope that referenced a non-existent column
  ActivityLog.belongsTo(models.Resource, {
    foreignKey: 'entityId',
    constraints: false,
    as: 'Resource'
  });
};

module.exports = ActivityLog;
