const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EventParticipant = sequelize.define(
  "EventParticipant",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    eventId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Events",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    attended: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = EventParticipant;
