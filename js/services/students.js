/**
 * Students service — all student-related API calls.
 * Registration numbers (e.g. EIC-2026-00001) are backend-generated;
 * this service never fabricates or edits them client-side.
 */
(function (global) {
  'use strict';

  const { STUDENTS } = ENOCH_ENDPOINTS;

  const StudentsService = {
    async me() {
      const payload = await ApiClient.get(STUDENTS.ME);
      return ApiClient.unwrapItem(payload)?.student || ApiClient.unwrapItem(payload);
    },
    async uploadProfilePicture(file) {
      const formData = new FormData();
      formData.append('file', file);
      const payload = await ApiClient.upload(STUDENTS.PROFILE_PICTURE, formData);
      return ApiClient.unwrapItem(payload)?.student || ApiClient.unwrapItem(payload);
    },
    async list({ page = 1, pageSize = 20, search = '', classId = '', classArmId = '', status = '' } = {}) {
      const payload = await ApiClient.get(STUDENTS.BASE, {
        page,
        pageSize,
        search: search || undefined,
        classId: classId || undefined,
        classArmId: classArmId || undefined,
        status: status || undefined,
      });
      return ApiClient.unwrapList(payload);
    },

    async get(studentId) {
      const payload = await ApiClient.get(STUDENTS.BY_ID(studentId));
      return ApiClient.unwrapItem(payload);
    },

    async create(data) {
      const payload = await ApiClient.post(STUDENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },

    async update(studentId, data) {
      const payload = await ApiClient.put(STUDENTS.BY_ID(studentId), data);
      return ApiClient.unwrapItem(payload);
    },

    async deactivate(studentId) {
      const payload = await ApiClient.patch(STUDENTS.DEACTIVATE(studentId), {});
      return ApiClient.unwrapItem(payload);
    },

    async delete(studentId) {
      return ApiClient.delete(STUDENTS.BY_ID(studentId));
    },
  };

  global.StudentsService = StudentsService;
})(window);
