(function (global) {
  'use strict';
  const { RESULTS } = ENOCH_ENDPOINTS;
  global.ResultsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(RESULTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(RESULTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async byStudent(studentId, params = {}) {
      const payload = await ApiClient.get(RESULTS.STUDENT(studentId), params);
      return ApiClient.unwrapList(payload);
    },
    async byClass(classId, params = {}) {
      const payload = await ApiClient.get(RESULTS.CLASS(classId), params);
      return ApiClient.unwrapList(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(RESULTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(RESULTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async publish(id) {
      const payload = await ApiClient.patch(RESULTS.PUBLISH(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(RESULTS.BY_ID(id));
    },
  };
})(window);
