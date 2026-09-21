(function (global) {
  'use strict';
  const { GALLERY } = ENOCH_ENDPOINTS;
  global.GalleryService = {
    async albums(params = {}) {
      const payload = await ApiClient.get(GALLERY.ALBUMS, params);
      return ApiClient.unwrapList(payload);
    },
    async getAlbum(id) {
      const payload = await ApiClient.get(GALLERY.ALBUM_BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async createAlbum(data) {
      const payload = await ApiClient.post(GALLERY.ALBUMS, data);
      return ApiClient.unwrapItem(payload);
    },
    async deleteAlbum(id) {
      return ApiClient.delete(GALLERY.ALBUM_BY_ID(id));
    },
    async images(albumId) {
      const payload = await ApiClient.get(GALLERY.IMAGES(albumId));
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
