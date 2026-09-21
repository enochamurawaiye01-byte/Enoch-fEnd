(function (global) {
  'use strict';
  const { DOCUMENTS } = ENOCH_ENDPOINTS;
  global.DocumentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(DOCUMENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(DOCUMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(formData) {
      const payload = await ApiClient.upload(DOCUMENTS.BASE, formData);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(DOCUMENTS.BY_ID(id));
    },
    downloadUrl(id) {
      return `${ENOCH_CONFIG.API_BASE_URL}${DOCUMENTS.DOWNLOAD(id)}`;
    },
  };
})(window);
