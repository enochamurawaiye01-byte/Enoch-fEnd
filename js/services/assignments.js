(function (global) {
  'use strict';
  const { ASSIGNMENTS } = ENOCH_ENDPOINTS;
  global.AssignmentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(ASSIGNMENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ASSIGNMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(ASSIGNMENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(ASSIGNMENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(ASSIGNMENTS.BY_ID(id));
    },
    async submissions(id) {
      const payload = await ApiClient.get(ASSIGNMENTS.SUBMISSIONS(id));
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
