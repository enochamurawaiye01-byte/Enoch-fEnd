(function (global) {
  'use strict';
  const { ANNOUNCEMENTS } = ENOCH_ENDPOINTS;
  global.AnnouncementsService = {
    async list(params = {}) {
      const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HEAD_TEACHER'];
      const query = Object.assign({}, params);
      if (adminRoles.includes(global.CurrentUser?.role)) query.manage = 'true';
      const payload = await ApiClient.get(ANNOUNCEMENTS.BASE, query);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ANNOUNCEMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(ANNOUNCEMENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(ANNOUNCEMENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async publish(id) {
      const payload = await ApiClient.patch(ANNOUNCEMENTS.PUBLISH(id), { published: true });
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(ANNOUNCEMENTS.BY_ID(id));
    },
  };
})(window);
