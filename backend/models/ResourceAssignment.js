const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User"); // Import User model
const Resource = require("./Resource"); // Import Resource model

const ResourceAssignment = sequelize.define("ResourceAssignment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  resourceId: {
    type: DataTypes.CHAR(36), // Explicitly define as CHAR(36) to match Resources.id
    allowNull: false,
    references: {
      model: Resource, // Reference the Resource model
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.CHAR(36), // Explicitly define as CHAR(36) to match users.id
    allowNull: false,
    references: {
      model: User, // Reference the User model
      key: 'id',
    },
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true, // Due date might be optional
  },
  status: {
    type: DataTypes.ENUM('assigned', 'completed', 'overdue', 'in_progress'), // Example statuses
    allowNull: false,
    defaultValue: 'assigned',
  },
  // Add other relevant fields like completedAt, notes, etc. if needed
});

// Associations
ResourceAssignment.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });
ResourceAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Resource.hasMany(ResourceAssignment, { foreignKey: 'resourceId' });
User.hasMany(ResourceAssignment, { foreignKey: 'userId' });

module.exports = ResourceAssignment; 