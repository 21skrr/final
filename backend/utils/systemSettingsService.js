const { SystemSetting } = require("../models");

const getSystemSetting = async (key) => {
    const setting = await SystemSetting.findOne({ where: { key } });
    if (!setting) return null;
  
    try {
      return typeof setting.value === "string"
        ? JSON.parse(setting.value)
        : setting.value;
    } catch {
      return setting.value;
    }
  };

const getMultipleSystemSettings = async (keys) => {
  const settings = await SystemSetting.findAll({ where: { key: keys } });
  const result = {};
  settings.forEach((s) => result[s.key] = s.value);
  return result;
};

const getAllSystemSettings = async () => {
  const settings = await SystemSetting.findAll();
  const formattedSettings = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
  return formattedSettings;
};

const updateSystemSettings = async (settingsToUpdate, updatedBy) => {
  const transaction = await SystemSetting.sequelize.transaction();
  try {
    for (const key in settingsToUpdate) {
      if (Object.hasOwnProperty.call(settingsToUpdate, key)) {
        const value = settingsToUpdate[key];
        await SystemSetting.upsert({
          key,
          value,
          updatedBy,
        }, { transaction });
      }
    }
    await transaction.commit();
    return await getAllSystemSettings();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getSystemSetting,
  getMultipleSystemSettings,
  getAllSystemSettings,
  updateSystemSettings,
};
