const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserTaskProgress extends Model {
    static associate(models) {
      // associations
      UserTaskProgress.belongsTo(models.User, {
        foreignKey: "UserId",
        onDelete: "CASCADE",
      });
      UserTaskProgress.belongsTo(models.OnboardingTask, {
        foreignKey: "OnboardingTaskId",
        onDelete: "CASCADE",
      });
    }
  }

  UserTaskProgress.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      UserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      OnboardingTaskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "OnboardingTasks",
          key: "id",
        },
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      supervisorNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hrValidated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "UserTaskProgress",
      tableName: "usertaskprogresses",
    }
  );

  return UserTaskProgress;
};
