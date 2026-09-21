(function (global) {
  'use strict';
  const { EVENTS } = ENOCH_ENDPOINTS;
  global.EventsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(EVENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(EVENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(EVENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(EVENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(EVENTS.BY_ID(id));
    },
  };
})(window);
