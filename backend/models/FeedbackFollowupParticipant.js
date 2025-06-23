const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeedbackFollowupParticipant = sequelize.define("feedback_followup_participants", {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  followupId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: "feedback_followups",
      key: "id"
    }
  },
  userId: {
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
  }
}, {
  tableName: "feedback_followup_participants",
  timestamps: false
});

module.exports = FeedbackFollowupParticipant; 