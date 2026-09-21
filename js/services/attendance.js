(function (global) {
  'use strict';
  const { ATTENDANCE } = ENOCH_ENDPOINTS;
  global.AttendanceService = {
    async list(params = {}) {
      const payload = await ApiClient.get(ATTENDANCE.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ATTENDANCE.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async byClass(classId, params = {}) {
      const payload = await ApiClient.get(ATTENDANCE.CLASS(classId), params);
      return ApiClient.unwrapList(payload);
    },
    async byStudent(studentId, params = {}) {
      const payload = await ApiClient.get(ATTENDANCE.STUDENT(studentId), params);
      return ApiClient.unwrapList(payload);
    },
    async stats(params = {}) {
      const payload = await ApiClient.get(ATTENDANCE.STATS, params);
      return ApiClient.unwrapItem(payload);
    },
    async mark(data) {
      const payload = await ApiClient.post(ATTENDANCE.MARK, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(ATTENDANCE.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
