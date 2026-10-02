/**
 * Students service — all student-related API calls.
 * Registration numbers (e.g. EIC-2026-00001) are backend-generated;
 * this service never fabricates or edits them client-side.
 */
(function (global) {
  'use strict';

  const { STUDENTS } = ENOCH_ENDPOINTS;

  function normalizeStudent(student) {
    if (!student) return student;
    return {
      ...student,
      regNumber: student.registrationNumber,
      email: student.user?.email || student.email || '',
      phone: student.user?.phoneNumber || student.phoneNumber || '',
      phoneNumber: student.user?.phoneNumber || student.phoneNumber || '',
      classId: student.currentClassId || student.classId || '',
      className: student.currentClass?.name || student.className || '',
      classArmName: student.currentClass?.arm || student.classArmName || '',
    };
  }

  const StudentsService = {
    async me() {
      const payload = await ApiClient.get(STUDENTS.ME);
      return normalizeStudent(ApiClient.unwrapItem(payload)?.student || ApiClient.unwrapItem(payload));
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
      const result = ApiClient.unwrapList(payload);
      return { ...result, items: result.items.map(normalizeStudent) };
    },

    async get(studentId) {
      const payload = await ApiClient.get(STUDENTS.BY_ID(studentId));
      return normalizeStudent(ApiClient.unwrapItem(payload));
    },

    async create(data) {
      const payload = await ApiClient.post(STUDENTS.BASE, data);
      return normalizeStudent(ApiClient.unwrapItem(payload));
    },

    async update(studentId, data) {
      const payload = await ApiClient.patch(STUDENTS.BY_ID(studentId), data);
      return ApiClient.unwrapItem(payload);
    },

    async deactivate(studentId) {
      const payload = await ApiClient.patch(STUDENTS.BY_ID(studentId), { status: 'INACTIVE' });
      return ApiClient.unwrapItem(payload);
    },

    async delete(studentId) {
      return this.deactivate(studentId);
    },
  };

  global.StudentsService = StudentsService;
})(window);
