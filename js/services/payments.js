(function (global) {
  'use strict';
  const { PAYMENTS } = ENOCH_ENDPOINTS;
  global.PaymentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(PAYMENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(PAYMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async byStudent(studentId, params = {}) {
      const payload = await ApiClient.get(PAYMENTS.BY_STUDENT(studentId), params);
      return ApiClient.unwrapList(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(PAYMENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
