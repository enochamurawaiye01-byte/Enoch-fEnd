(function (global) {
  'use strict';
  const { FEES } = ENOCH_ENDPOINTS;
  global.FeesService = {
    async list(params = {}) {
      const payload = await ApiClient.get(FEES.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(FEES.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(FEES.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(FEES.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(FEES.BY_ID(id));
    },
  };
})(window);
