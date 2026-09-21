(function (global) {
  'use strict';
  const { LESSONS } = ENOCH_ENDPOINTS;
  global.LessonsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(LESSONS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(LESSONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(LESSONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(LESSONS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(LESSONS.BY_ID(id));
    },
  };
})(window);
