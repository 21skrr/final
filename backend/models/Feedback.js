const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Feedback = sequelize.define(
  "Feedback",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    fromUserId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    toUserId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    },
    toDepartment: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM("onboarding", "training", "support", "general"),
      allowNull: false,
      defaultValue: "general"
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isAnonymous: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    categories: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('categories');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('categories', JSON.stringify(value));
      }
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: true
    }
  },
  {
    tableName: "feedback",
    modelName: "Feedback",
    timestamps: true
  }
);

Feedback.associate = (models) => {
  Feedback.belongsTo(models.User, {
    foreignKey: "fromUserId",
    as: "sender"
  });

  Feedback.belongsTo(models.User, {
    foreignKey: "toUserId",
    as: "receiver"
  });

  Feedback.hasMany(models.FeedbackNote, {
    foreignKey: "feedbackId",
    as: "notes"
  });
};

module.exports = Feedback;
