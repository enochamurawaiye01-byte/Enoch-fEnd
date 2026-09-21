(function (global) {
  'use strict';
  const { MESSAGES } = ENOCH_ENDPOINTS;
  global.MessagesService = {
    async inbox(params = {}) {
      const payload = await ApiClient.get(MESSAGES.INBOX, params);
      return ApiClient.unwrapList(payload);
    },
    async sent(params = {}) {
      const payload = await ApiClient.get(MESSAGES.SENT, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(MESSAGES.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async compose(data) {
      const payload = await ApiClient.post(MESSAGES.COMPOSE, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
