(function (global) {
  'use strict';
  const { AUDIT_LOGS } = ENOCH_ENDPOINTS;
  global.AuditLogsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(AUDIT_LOGS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(AUDIT_LOGS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
