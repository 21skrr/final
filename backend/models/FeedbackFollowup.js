const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeedbackFollowup = sequelize.define("feedback_followups", {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  feedbackId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: "feedback",
      key: "id"
    }
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
    defaultValue: "scheduled",
    allowNull: false
  },
  createdBy: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: "users",
      key: "id"
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
  }
}, {
  tableName: "feedback_followups",
  timestamps: false
});

// Define associations
FeedbackFollowup.associate = (models) => {
  FeedbackFollowup.belongsTo(models.Feedback, {
    foreignKey: "feedbackId",
    as: "feedback"
  });
  
  FeedbackFollowup.belongsTo(models.User, {
    foreignKey: "createdBy",
    as: "creator"
  });

  FeedbackFollowup.belongsToMany(models.User, {
    through: "feedback_followup_participants",
    foreignKey: "followupId",
    otherKey: "userId",
    as: "participants"
  });
};

module.exports = FeedbackFollowup; 