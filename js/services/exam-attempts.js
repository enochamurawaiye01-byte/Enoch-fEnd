(function (global) {
  'use strict';
  const { EXAM_ATTEMPTS } = ENOCH_ENDPOINTS;
  global.ExamAttemptsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(EXAM_ATTEMPTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(EXAM_ATTEMPTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async byStudent(studentId) {
      const payload = await ApiClient.get(EXAM_ATTEMPTS.BY_STUDENT(studentId));
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
