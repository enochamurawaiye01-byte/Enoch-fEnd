(function (global) {
  'use strict';
  const { SUBJECTS } = ENOCH_ENDPOINTS;

  global.SubjectsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(SUBJECTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(SUBJECTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(SUBJECTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(SUBJECTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async deactivate(id) {
      const payload = await ApiClient.patch(`${SUBJECTS.BY_ID(id)}/deactivate`, {});
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(SUBJECTS.BY_ID(id));
    },
  };
})(window);
