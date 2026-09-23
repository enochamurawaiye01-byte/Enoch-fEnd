(function (global) {
  'use strict';
  const { EXAMINATIONS } = ENOCH_ENDPOINTS;
  global.ExaminationsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(EXAMINATIONS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(EXAMINATIONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(EXAMINATIONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(EXAMINATIONS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(EXAMINATIONS.BY_ID(id));
    },
  };
})(window);
