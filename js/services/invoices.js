(function (global) {
  'use strict';
  const { INVOICES } = ENOCH_ENDPOINTS;
  global.InvoicesService = {
    async list(params = {}) {
      const payload = await ApiClient.get(INVOICES.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(INVOICES.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(INVOICES.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(INVOICES.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(INVOICES.BY_ID(id));
    },
  };
})(window);
