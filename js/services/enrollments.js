(function (global) {
  'use strict';
  const { ENROLLMENTS } = ENOCH_ENDPOINTS;
  global.EnrollmentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(ENROLLMENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ENROLLMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(ENROLLMENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(ENROLLMENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(ENROLLMENTS.BY_ID(id));
    },
  };
})(window);
