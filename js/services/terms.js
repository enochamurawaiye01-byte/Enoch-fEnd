/**
 * Terms service — every academic session has exactly three terms:
 * FIRST, SECOND, THIRD. The frontend never invents a fourth or lets the
 * user activate/close a term the backend has not returned as eligible;
 * it only reflects and acts on backend-provided status.
 */
(function (global) {
  'use strict';

  const { TERMS } = ENOCH_ENDPOINTS;

  const TermsService = {
    TERM_NAMES: ['FIRST', 'SECOND', 'THIRD'],

    async list(params = {}) {
      const sessionId = params.academicSessionId || params.sessionId;
      if (sessionId) {
        const payload = await ApiClient.get(TERMS.BY_SESSION(sessionId));
        return ApiClient.unwrapList(payload);
      }
      const sessionsRes = await AcademicSessionsService.list({ pageSize: 100 }).catch(() => ({ items: [] }));
      const sessionsList = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes.items || []);
      if (!sessionsList.length) return { items: [], meta: null };
      const lists = await Promise.all(sessionsList.map((session) => ApiClient.get(TERMS.BY_SESSION(session.id)).catch(() => ({ items: [] }))));
      const items = lists.flatMap((payload) => ApiClient.unwrapList(payload).items || []);
      return { items, meta: null };
    },

    async get(id) {
      const payload = await ApiClient.get(TERMS.BY_ID(id));
      return ApiClient.unwrapItem(payload);
    },
    async current() {
      const payload = await ApiClient.get(TERMS.CURRENT);
      return ApiClient.unwrapItem(payload);
    },
    async create(data) {
      const { academicSessionId, ...termData } = data;
      const payload = await ApiClient.post(TERMS.BY_SESSION(academicSessionId), termData);
      return ApiClient.unwrapItem(payload);
    },
    async update(id, data) {
      const { academicSessionId, ...termData } = data;
      const payload = await ApiClient.patch(TERMS.BY_ID(id), termData);
      return ApiClient.unwrapItem(payload);
    },
    async activate(id) {
      const payload = await ApiClient.patch(TERMS.ACTIVATE(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async close(id) {
      const payload = await ApiClient.patch(TERMS.CLOSE(id), {});
      return ApiClient.unwrapItem(payload);
    },
    async delete(id) {
      return ApiClient.delete(TERMS.BY_ID(id));
    },
  };

  global.TermsService = TermsService;
})(window);
