(function (global) {
  'use strict';
  const { FINANCIAL_REPORTS } = ENOCH_ENDPOINTS;
  global.FinancialReportsService = {
    async revenue(params = {}) {
      const report = await this.report(params);
      return report.payments || [];
    },
    async outstanding(params = {}) {
      const report = await this.report(params);
      return report.feeAccounts || [];
    },
    async summary(params = {}) {
      const report = await this.report(params);
      return report.summary || {};
    },
    async report(params = {}) {
      const payload = await ApiClient.get(FINANCIAL_REPORTS.FINANCIAL, params);
      return ApiClient.unwrapItem(payload) || {};
    },
  };
})(window);
