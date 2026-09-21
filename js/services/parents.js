(function (global) {
  'use strict';
  const { PARENTS } = ENOCH_ENDPOINTS;
  global.ParentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(PARENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(PARENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(PARENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(PARENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(PARENTS.BY_ID(id));
    },
    async children(id) {
      const payload = await ApiClient.get(PARENTS.CHILDREN(id));
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
