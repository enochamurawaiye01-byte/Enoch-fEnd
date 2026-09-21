(function (global) {
  'use strict';
  const { RECEIPTS } = ENOCH_ENDPOINTS;
  global.ReceiptsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(RECEIPTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(RECEIPTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
