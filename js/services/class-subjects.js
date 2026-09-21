(function (global) {
  'use strict';
  const { CLASS_SUBJECTS } = ENOCH_ENDPOINTS;
  global.ClassSubjectsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(CLASS_SUBJECTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(CLASS_SUBJECTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(CLASS_SUBJECTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(CLASS_SUBJECTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(CLASS_SUBJECTS.BY_ID(id));
    },
  };
})(window);
