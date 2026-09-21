(function (global) {
  'use strict';
  const { NOTIFICATIONS } = ENOCH_ENDPOINTS;
  global.NotificationsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(NOTIFICATIONS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async unreadCount() {
      const payload = await ApiClient.get(NOTIFICATIONS.UNREAD_COUNT);
      return ApiClient.unwrapItem(payload);
    },
    async markRead(id) {
      const payload = await ApiClient.patch(NOTIFICATIONS.MARK_READ(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async markAllRead() {
      return ApiClient.post(NOTIFICATIONS.MARK_ALL_READ, {});
    },
  };
})(window);
