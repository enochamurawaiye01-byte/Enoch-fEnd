(function (global) {
  'use strict';
  const { INVENTORY } = ENOCH_ENDPOINTS;
  global.InventoryService = {
    async listItems(params = {}) {
      const payload = await ApiClient.get(INVENTORY.ITEMS, params);
      return ApiClient.unwrapList(payload);
    },
    async getItem(id) {
      const payload = await ApiClient.get(INVENTORY.ITEM_BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async createItem(data) {
      const payload = await ApiClient.post(INVENTORY.ITEMS, data);
      return ApiClient.unwrapItem(payload);
    },
    async updateItem(id, data) {
      const payload = await ApiClient.put(INVENTORY.ITEM_BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async deleteItem(id) {
      return ApiClient.delete(INVENTORY.ITEM_BY_ID(id));
    },
    async categories(params = {}) {
      const payload = await ApiClient.get(INVENTORY.CATEGORIES, params);
      return ApiClient.unwrapList(payload);
    },
    async movements(params = {}) {
      const payload = await ApiClient.get(INVENTORY.MOVEMENTS, params);
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
