(function (global) {
  'use strict';
  const { USERS } = ENOCH_ENDPOINTS;
  global.UsersService = {
    async list(params = {}) {
      const payload = await ApiClient.get(USERS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(USERS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(USERS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(USERS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async activate(id) {
      const payload = await ApiClient.patch(USERS.STATUS(id), { status: 'ACTIVE' });
      return ApiClient.unwrapItem(payload);
    },
    async deactivate(id) {
      const payload = await ApiClient.patch(USERS.STATUS(id), { status: 'INACTIVE' });
      return ApiClient.unwrapItem(payload);
    },
    async reject(id) {
      const payload = await ApiClient.patch(USERS.STATUS(id), { status: 'DEACTIVATED' });
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.patch(USERS.STATUS(id), { status: 'DEACTIVATED' });
    },
  };
})(window);
