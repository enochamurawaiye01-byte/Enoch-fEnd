(function (global) {
  'use strict';
  const { TRANSPORT } = ENOCH_ENDPOINTS;
  global.TransportService = {
    async vehicles(params = {}) {
      const payload = await ApiClient.get(TRANSPORT.VEHICLES, params);
      return ApiClient.unwrapList(payload);
    },
    async createVehicle(data) {
      const payload = await ApiClient.post(TRANSPORT.VEHICLES, data);
      return ApiClient.unwrapItem(payload);
    },
    async drivers(params = {}) {
      const payload = await ApiClient.get(TRANSPORT.DRIVERS, params);
      return ApiClient.unwrapList(payload);
    },
    async routes(params = {}) {
      const payload = await ApiClient.get(TRANSPORT.ROUTES, params);
      return ApiClient.unwrapList(payload);
    },
    async createRoute(data) {
      const payload = await ApiClient.post(TRANSPORT.ROUTES, data);
      return ApiClient.unwrapItem(payload);
    },
    async assignments(params = {}) {
      const payload = await ApiClient.get(TRANSPORT.ASSIGNMENTS, params);
      return ApiClient.unwrapList(payload);
    },
    async createAssignment(data) {
      const payload = await ApiClient.post(TRANSPORT.ASSIGNMENTS, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
