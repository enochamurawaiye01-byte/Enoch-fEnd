(function (global) {
  'use strict';
  const { TEACHERS } = ENOCH_ENDPOINTS;
  global.TeachersService = {
    async list(params = {}) {
      const payload = await ApiClient.get(TEACHERS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(TEACHERS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(TEACHERS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(TEACHERS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(TEACHERS.BY_ID(id));
    },
    async assignments(id) {
      const payload = await ApiClient.get(TEACHERS.ASSIGNMENTS(id));
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
