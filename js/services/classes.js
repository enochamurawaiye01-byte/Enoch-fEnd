/**
 * Classes service — class levels (JSS1, JSS2 … SS3) and their arms/streams
 * (e.g. JSS1 A, JSS1 Blue). Arms are configurable, never assumed absent.
 */
(function (global) {
  'use strict';

  const { CLASSES, CLASS_ARMS } = ENOCH_ENDPOINTS;

  const ClassesService = {
    async list(params = {}) {
      const payload = await ApiClient.get(CLASSES.BASE, params);
      return ApiClient.unwrapList(payload);
    },
    async get(classId) {
      const payload = await ApiClient.get(CLASSES.BY_ID(classId));
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(CLASSES.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(classId, data) {
      const payload = await ApiClient.put(CLASSES.BY_ID(classId), data);
      return ApiClient.unwrapItem(payload);
    },
    async delete(classId) {
      return ApiClient.delete(CLASSES.BY_ID(classId));
    },
    async arms(classId) {
      const payload = await ApiClient.get(CLASSES.ARMS(classId));
      return ApiClient.unwrapList(payload);
    },
    async students(classId, params = {}) {
      const payload = await ApiClient.get(CLASSES.STUDENTS(classId), params);
      return ApiClient.unwrapList(payload);
    },
    async createArm(data) {
      const payload = await ApiClient.post(CLASS_ARMS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async updateArm(armId, data) {
      const payload = await ApiClient.put(CLASS_ARMS.BY_ID(armId), data);
      return ApiClient.unwrapItem(payload);
    },
    async deleteArm(armId) {
      return ApiClient.delete(CLASS_ARMS.BY_ID(armId));
    },
  };

  global.ClassesService = ClassesService;
})(window);
