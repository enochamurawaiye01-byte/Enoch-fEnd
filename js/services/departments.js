(function (global) {
  'use strict';
  const { DEPARTMENTS } = ENOCH_ENDPOINTS;

  global.DepartmentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(DEPARTMENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(DEPARTMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(DEPARTMENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(DEPARTMENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(DEPARTMENTS.BY_ID(id));
    },
  };
})(window);
