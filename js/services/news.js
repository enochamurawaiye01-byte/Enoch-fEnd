(function (global) {
  'use strict';
  const { NEWS } = ENOCH_ENDPOINTS;
  global.NewsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(NEWS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(NEWS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(NEWS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(NEWS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async publish(id) {
      const payload = await ApiClient.patch(NEWS.PUBLISH(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(NEWS.BY_ID(id));
    },
  };
})(window);
