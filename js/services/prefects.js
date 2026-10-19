(function (global) {
  'use strict';

  const { PREFECTS } = ENOCH_ENDPOINTS;
  global.PrefectsService = {
    async list(params = {}) {
      return ApiClient.unwrapList(await ApiClient.get(PREFECTS.BASE, params));
    },
    async get(id) {
      return ApiClient.unwrapItem(await ApiClient.get(PREFECTS.BY_ID(id)));
    },
    async create(data) {
      return ApiClient.unwrapItem(await ApiClient.post(PREFECTS.BASE, data));
    },
    async update(id, data) {
      return ApiClient.unwrapItem(await ApiClient.patch(PREFECTS.BY_ID(id), data));
    },
    async revoke(id) {
      return ApiClient.delete(PREFECTS.BY_ID(id));
    },
    async listPositions() {
      return ApiClient.unwrapList(await ApiClient.get(PREFECTS.POSITIONS));
    },
    async createPosition(data) {
      return ApiClient.unwrapItem(await ApiClient.post(PREFECTS.POSITIONS, data));
    },
  };
})(window);
