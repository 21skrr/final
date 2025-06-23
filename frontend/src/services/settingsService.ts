import api from './api';

// --- User Settings ---

export const getUserSettings = async (userId: string) => {
  const { data } = await api.get(`/settings/${userId}`);
  return data;
};

export const updateUserSettings = async (userId: string, settings: any) => {
  const { data } = await api.put(`/settings/${userId}`, settings);
  return data;
};

// --- System Settings (HR/Admin) ---

export const getSystemSettings = async () => {
  const { data } = await api.get('/settings/system');
  return data;
};

export const updateSystemSettings = async (settings: any) => {
  const { data } = await api.put('/settings/system', settings);
  return data;
};

// --- Manager Preferences ---

export const getManagerPreferences = async () => {
  const { data } = await api.get('/users/managers/me/preferences');
  return data;
};

export const updateManagerPreferences = async (preferences: any) => {
  const { data } = await api.put('/users/managers/me/preferences', preferences);
  return data;
};

const settingsService = {
  getUserSettings,
  updateUserSettings,
  getSystemSettings,
  updateSystemSettings,
  getManagerPreferences,
  updateManagerPreferences,
};

export default settingsService; 