(function (global) {
  'use strict';
  const { EVENTS } = ENOCH_ENDPOINTS;
  const toFormData = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'image') {
        if (value) formData.append(key, value);
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    return formData;
  };
  global.EventsService = {
    async list(params = {}) {
      const { pageSize, ...filters } = params;
      const payload = await ApiClient.get(EVENTS.BASE, { ...filters, limit: params.limit || pageSize });
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(EVENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.upload(EVENTS.BASE, toFormData(data));
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.request
        ? ApiClient.upload(EVENTS.BY_ID(id), toFormData(data), { method: 'PATCH' })
        : ApiClient.patch(EVENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async publish(id, published) {
      const payload = await ApiClient.patch(EVENTS.PUBLISH(id), { published });
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(EVENTS.BY_ID(id));
    },
  };
})(window);
