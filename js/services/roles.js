(function (global) {
  'use strict';
  const { ROLES } = ENOCH_ENDPOINTS;
  global.RolesService = {
    async list() {
      const payload = await ApiClient.get(ROLES.BASE);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ROLES.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(ROLES.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(ROLES.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(ROLES.BY_ID(id));
    },
    async assign(data) {
      const payload = await ApiClient.post(ROLES.ASSIGN, data);
      return ApiClient.unwrapItem(payload);
    },
    async revoke(data) {
      const payload = await ApiClient.post(ROLES.REVOKE, data);
      return ApiClient.unwrapItem(payload);
    },
    async changeUserRole(userId, role) {
      const payload = await ApiClient.patch(ROLES.CHANGE_USER_ROLE(userId), { role });
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
