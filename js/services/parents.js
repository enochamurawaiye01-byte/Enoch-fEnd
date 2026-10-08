(function (global) {
  'use strict';
  const { PARENTS } = ENOCH_ENDPOINTS;

  function normalizeChild(student) {
    if (!student) return student;
    const currentClass = student.currentClass || student.class || {};
    return {
      ...student,
      regNumber: student.registrationNumber || student.regNumber,
      className: currentClass.name || student.className || '',
      classArmName: currentClass.arm || currentClass.classArm?.name || student.classArm?.name || student.classArmName || '',
    };
  }

  global.ParentsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(PARENTS.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(PARENTS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(PARENTS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(PARENTS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(PARENTS.BY_ID(id));
    },
    async children() {
      const payload = await ApiClient.get('/parents/me/children');
      const result = ApiClient.unwrapList(payload);
      return { ...result, items: result.items.map(normalizeChild) };
    },
    async child(id) {
      const payload = await ApiClient.get(`/parents/me/children/${encodeURIComponent(id)}`);
      return normalizeChild(ApiClient.unwrapItem(payload));
    },
    async childResults(id, params = {}) {
      const payload = await ApiClient.get(`/parents/me/children/${encodeURIComponent(id)}/results`, params);
      return ApiClient.unwrapList(payload);
    },
  };
})(window);
