(function (global) {
  'use strict';
  const { HOSTEL } = ENOCH_ENDPOINTS;
  global.HostelService = {
    async hostels(params = {}) {
      const payload = await ApiClient.get(HOSTEL.HOSTELS, params);
      return ApiClient.unwrapList(payload);
    },
    async createHostel(data) {
      const payload = await ApiClient.post(HOSTEL.HOSTELS, data);
      return ApiClient.unwrapItem(payload);
    },
    async rooms(params = {}) {
      const payload = await ApiClient.get(HOSTEL.ROOMS, params);
      return ApiClient.unwrapList(payload);
    },
    async createRoom(data) {
      const payload = await ApiClient.post(HOSTEL.ROOMS, data);
      return ApiClient.unwrapItem(payload);
    },
    async allocations(params = {}) {
      const payload = await ApiClient.get(HOSTEL.ALLOCATIONS, params);
      return ApiClient.unwrapList(payload);
    },
    async createAllocation(data) {
      const payload = await ApiClient.post(HOSTEL.ALLOCATIONS, data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
