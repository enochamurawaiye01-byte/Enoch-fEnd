(function (global) {
  'use strict';
  const { REPORT_CARDS } = ENOCH_ENDPOINTS;

  global.ReportCardsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(REPORT_CARDS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(REPORT_CARDS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async publish(id, published, portal) {
      const payload = await ApiClient.patch(REPORT_CARDS.PUBLICATION(id), { published, ...(portal ? { portal } : {}) });
      return ApiClient.unwrapItem(payload);
    },
    async publishClassTerm(data) {
      const payload = await ApiClient.post(REPORT_CARDS.CLASS_TERM_PUBLICATION, data);
      return ApiClient.unwrapItem(payload);
    },
    async getConfiguration() {
      const payload = await ApiClient.get(REPORT_CARDS.CONFIGURATION);
      return ApiClient.unwrapItem(payload);
    },
    async updateConfiguration(data) {
      const payload = await ApiClient.put(REPORT_CARDS.CONFIGURATION, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);