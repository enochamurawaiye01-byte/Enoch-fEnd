(function (global) {
  'use strict';
  const { PERMISSIONS } = ENOCH_ENDPOINTS;
  global.PermissionsService = {
    async list() {
      const payload = await ApiClient.get(PERMISSIONS.BASE);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(PERMISSIONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(PERMISSIONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(PERMISSIONS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(PERMISSIONS.BY_ID(id));
    },
    async assign(data) {
      const payload = await ApiClient.post(PERMISSIONS.ASSIGN, data);
      return ApiClient.unwrapItem(payload);
    },
    async revoke(data) {
      const payload = await ApiClient.post(PERMISSIONS.REVOKE, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
