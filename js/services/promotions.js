(function (global) {
  'use strict';
  const { PROMOTIONS } = ENOCH_ENDPOINTS;
  global.PromotionsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(PROMOTIONS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(PROMOTIONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(PROMOTIONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async history(studentId) {
      const payload = await ApiClient.get(PROMOTIONS.HISTORY(studentId));
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
