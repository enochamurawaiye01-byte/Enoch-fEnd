(function (global) {
  'use strict';
  const { MEDICAL } = ENOCH_ENDPOINTS;
  global.MedicalService = {
    async records(params = {}) {
      const payload = await ApiClient.get(MEDICAL.RECORDS, params);
      return ApiClient.unwrapList(payload);
    },
    async getRecord(id) {
      const payload = await ApiClient.get(MEDICAL.RECORD_BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async createRecord(data) {
      const payload = await ApiClient.post(MEDICAL.RECORDS, data);
      return ApiClient.unwrapItem(payload);
    },
    async updateRecord(id, data) {
      const payload = await ApiClient.put(MEDICAL.RECORD_BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async deleteRecord(id) {
      return ApiClient.delete(MEDICAL.RECORD_BY_ID(id));
    },
    async visits(params = {}) {
      const payload = await ApiClient.get(MEDICAL.VISITS, params);
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
