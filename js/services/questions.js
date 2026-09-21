(function (global) {
  'use strict';
  const { QUESTIONS } = ENOCH_ENDPOINTS;
  global.QuestionsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(QUESTIONS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(QUESTIONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async byExam(examId) {
      const payload = await ApiClient.get(QUESTIONS.BY_EXAM(examId));
      return ApiClient.unwrapList(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(QUESTIONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(QUESTIONS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(QUESTIONS.BY_ID(id));
    },
  };
})(window);
