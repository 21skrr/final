const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SystemSetting = sequelize.define(
    "SystemSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.TEXT('long'), // since your DB uses longtext
        allowNull: false,
        get() {
          try {
            return JSON.parse(this.getDataValue("value"));
          } catch (err) {
            return this.getDataValue("value");
          }
        },
        set(val) {
          this.setDataValue("value", JSON.stringify(val));
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "systemsettings",
      timestamps: true,
    }
  );

  return SystemSetting;
};
