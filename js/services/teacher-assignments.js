(function (global) {
  'use strict';
  const { TEACHER_ASSIGNMENTS } = ENOCH_ENDPOINTS;
  global.TeacherAssignmentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(TEACHER_ASSIGNMENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(TEACHER_ASSIGNMENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(TEACHER_ASSIGNMENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      throw new Error('Teacher assignments can only be added or removed.');
    },
    async delete(id) {
      return ApiClient.delete(TEACHER_ASSIGNMENTS.BY_ID(id));
    },
    async listClassTeachers(params = {}) {
      const payload = await ApiClient.get(TEACHER_ASSIGNMENTS.CLASS_TEACHERS, params);
      return ApiClient.unwrapList(payload);
    },
    async assignClassTeacher(data) {
      const payload = await ApiClient.post(TEACHER_ASSIGNMENTS.CLASS_TEACHERS, data);
      return ApiClient.unwrapItem(payload);
    },
    async removeClassTeacher(id) {
      return ApiClient.delete(TEACHER_ASSIGNMENTS.CLASS_TEACHER_BY_ID(id));
    },
  };
})(window);
