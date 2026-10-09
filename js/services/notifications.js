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
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return ApiClient.unwrapItem(payload);
    },
    async markAllRead() {
      const payload = await ApiClient.post(NOTIFICATIONS.MARK_ALL_READ, {});
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return payload;
    },
    async getPushKey() {
      const payload = await ApiClient.get(NOTIFICATIONS.PUSH_KEY);
      return ApiClient.unwrapItem(payload);
    },
    async savePushSubscription(subscription) {
      return ApiClient.post(NOTIFICATIONS.PUSH_SUBSCRIPTION, subscription);
    },
    async removePushSubscription(endpoint) {
      return ApiClient.post(NOTIFICATIONS.REMOVE_PUSH_SUBSCRIPTION, { endpoint });
    },
  };
})(window);
