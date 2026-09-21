/**
 * Terms service — every academic session has exactly three terms:
 * FIRST, SECOND, THIRD. The frontend never invents a fourth or lets the
 * user activate/close a term the backend has not returned as eligible;
 * it only reflects and acts on backend-provided status.
 */
(function (global) {
  'use strict';

  const { TERMS } = ENOCH_ENDPOINTS;

  const TermsService = {
    TERM_NAMES: ['FIRST', 'SECOND', 'THIRD'],

    async list(params = {}) {
      const payload = await ApiClient.get(TERMS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(TERMS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async current() {
      const payload = await ApiClient.get(TERMS.CURRENT);
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(TERMS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(TERMS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async activate(id) {
      const payload = await ApiClient.patch(TERMS.ACTIVATE(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async close(id) {
      const payload = await ApiClient.patch(TERMS.CLOSE(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(TERMS.BY_ID(id));
    },
  };

  global.TermsService = TermsService;
})(window);
