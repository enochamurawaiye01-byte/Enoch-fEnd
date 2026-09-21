(function (global) {
  'use strict';
  const { FEE_ACCOUNTS } = ENOCH_ENDPOINTS;
  global.FeeAccountsService = {
    async byStudent(studentId) {
      const payload = await ApiClient.get(FEE_ACCOUNTS.BY_STUDENT(studentId));
      return ApiClient.unwrapItem(payload);
    },
    async list(params = {}) {
      const payload = await ApiClient.get(FEE_ACCOUNTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
