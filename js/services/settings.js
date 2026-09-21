(function (global) {
  'use strict';
  const { SETTINGS } = ENOCH_ENDPOINTS;
  global.SettingsService = {
    async getSchool() {
      const payload = await ApiClient.get(SETTINGS.SCHOOL);
      return ApiClient.unwrapItem(payload);
    },
    async updateSchool(data) {
      const payload = await ApiClient.put(SETTINGS.SCHOOL, data);
      return ApiClient.unwrapItem(payload);
    },
    async getProfile() {
      const payload = await ApiClient.get(SETTINGS.PROFILE);
      return ApiClient.unwrapItem(payload);
    },
    async updateProfile(data) {
      const payload = await ApiClient.put(SETTINGS.PROFILE, data);
      return ApiClient.unwrapItem(payload);
    },
    async getPreferences() {
      const payload = await ApiClient.get(SETTINGS.PREFERENCES);
      return ApiClient.unwrapItem(payload);
    },
    async updatePreferences(data) {
      const payload = await ApiClient.put(SETTINGS.PREFERENCES, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
