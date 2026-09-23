/**
 * Academic Sessions service — a session (e.g. "2025/2026") contains
 * three terms. Only one session should be active at a time; the backend
 * enforces this, the frontend just reflects returned status.
 */
(function (global) {
  'use strict';

  const { ACADEMIC_SESSIONS } = ENOCH_ENDPOINTS;

  const AcademicSessionsService = {
    async list(params = {}) {
      const payload = await ApiClient.get(ACADEMIC_SESSIONS.BASE, params);
      if (payload?.data?.sessions) return { items: payload.data.sessions, meta: null };
      return ApiClient.unwrapList(payload);
    },
    async get(id) {
      const payload = await ApiClient.get(ACADEMIC_SESSIONS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async current() {
      const payload = await ApiClient.get(ACADEMIC_SESSIONS.CURRENT);
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const payload = await ApiClient.post(ACADEMIC_SESSIONS.BASE, data);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const payload = await ApiClient.patch(ACADEMIC_SESSIONS.BY_ID(id), data);
      return ApiClient.unwrapItem(payload);
    },
    async activate(id) {
      const payload = await ApiClient.patch(ACADEMIC_SESSIONS.ACTIVATE(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async close(id) {
      throw new Error('Academic sessions can only be deleted or activated.');
    },
    async delete(id) {
      return ApiClient.delete(ACADEMIC_SESSIONS.BY_ID(id));
    },
  };

  global.AcademicSessionsService = AcademicSessionsService;
})(window);
