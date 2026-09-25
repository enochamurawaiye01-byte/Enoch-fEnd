(function (global) {
  'use strict';
  const { ADMISSIONS } = ENOCH_ENDPOINTS;
  global.AdmissionsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(ADMISSIONS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ADMISSIONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(ADMISSIONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(ADMISSIONS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async convertToStudent(id, data = {}) {
      const payload = await ApiClient.post(ADMISSIONS.CONVERT(id), data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
