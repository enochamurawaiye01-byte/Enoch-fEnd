(function (global) {
  'use strict';
  const { REPORTS } = ENOCH_ENDPOINTS;
  global.ReportsService = {
    async academic(params = {}) {
      const payload = await ApiClient.get(REPORTS.ACADEMIC, params);
      return ApiClient.unwrapItem(payload);
    },
    async attendance(params = {}) {
      const payload = await ApiClient.get(REPORTS.ATTENDANCE, params);
      return ApiClient.unwrapItem(payload);
    },
    async financial(params = {}) {
      const payload = await ApiClient.get(REPORTS.FINANCIAL, params);
      return ApiClient.unwrapItem(payload);
    },
    async examination(params = {}) {
      const payload = await ApiClient.get(REPORTS.EXAMINATION, params);
      return ApiClient.unwrapItem(payload);
    },
    async operational(params = {}) {
      const payload = await ApiClient.get(REPORTS.OPERATIONAL, params);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
