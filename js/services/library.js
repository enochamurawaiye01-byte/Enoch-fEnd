(function (global) {
  'use strict';
  const { LIBRARY } = ENOCH_ENDPOINTS;
  global.LibraryService = {
    async listBooks(params = {}) {
      const payload = await ApiClient.get(LIBRARY.BOOKS, params);
      return ApiClient.unwrapList(payload);
    },
    async getBook(id) {
      const payload = await ApiClient.get(LIBRARY.BOOK_BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async createBook(data) {
      const payload = await ApiClient.post(LIBRARY.BOOKS, data);
      return ApiClient.unwrapItem(payload);
    },
    async updateBook(id, data) {
      const payload = await ApiClient.put(LIBRARY.BOOK_BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async deleteBook(id) {
      return ApiClient.delete(LIBRARY.BOOK_BY_ID(id));
    },
    async members(params = {}) {
      const payload = await ApiClient.get(LIBRARY.MEMBERS, params);
      return ApiClient.unwrapList(payload);
    },
    async borrow(data) {
      const payload = await ApiClient.post(LIBRARY.BORROW, data);
      return ApiClient.unwrapItem(payload);
    },
    async returnBook(data) {
      const payload = await ApiClient.post(LIBRARY.RETURN, data);
      return ApiClient.unwrapItem(payload);
    },
    async overdue(params = {}) {
      const payload = await ApiClient.get(LIBRARY.OVERDUE, params);
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
