(function (global) {
  'use strict';
  const { TIMETABLE } = ENOCH_ENDPOINTS;
  global.TimetableService = {
    async list(params = {}) {
      const payload = await ApiClient.get(TIMETABLE.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(TIMETABLE.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async byClass(classId, params = {}) {
      const payload = await ApiClient.get(TIMETABLE.CLASS(classId), params);
      return ApiClient.unwrapList(payload);
    },
    async byTeacher(teacherId, params = {}) {
      const payload = await ApiClient.get(TIMETABLE.TEACHER(teacherId), params);
      return ApiClient.unwrapList(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(TIMETABLE.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.put(TIMETABLE.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(TIMETABLE.BY_ID(id));
    },
  };
})(window);
