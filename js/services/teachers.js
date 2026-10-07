(function (global) {
  'use strict';
  const { TEACHERS } = ENOCH_ENDPOINTS;
  global.TeachersService = {
    async list(params = {}) {
      const payload = await ApiClient.get(TEACHERS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(TEACHERS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async getCurrent() {
      const payload = await ApiClient.get(TEACHERS.ME);
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(TEACHERS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(TEACHERS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async activate(id) {
      const payload = await ApiClient.patch(`${TEACHERS.BY_ID(id)}/status`, { status: 'ACTIVE' });
      return ApiClient.unwrapItem(payload);
    },
    async deactivate(id) {
      const payload = await ApiClient.patch(`${TEACHERS.BY_ID(id)}/status`, { status: 'INACTIVE' });
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return this.deactivate(id);
    },
    async assignments(id) {
      const payload = await ApiClient.get(TEACHERS.MY_ASSIGNMENTS);
      return ApiClient.unwrapList(payload);
    },
    async uploadProfilePicture(file) {
      const formData = new FormData();
      formData.append('file', file);
      const payload = await ApiClient.upload(TEACHERS.PROFILE_PICTURE, formData);
      return ApiClient.unwrapItem(payload);
    },
    async removeProfilePicture() {
      const payload = await ApiClient.delete(TEACHERS.PROFILE_PICTURE);
      return ApiClient.unwrapItem(payload);
    },
    async uploadProfilePicture(file) {
      const formData = new FormData();
      formData.append('file', file);
      const payload = await ApiClient.upload(TEACHERS.PROFILE_PICTURE, formData);
      return ApiClient.unwrapItem(payload);
    },
    async removeProfilePicture() {
      const payload = await ApiClient.delete(TEACHERS.PROFILE_PICTURE);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
