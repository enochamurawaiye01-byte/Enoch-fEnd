(function (global) {
  'use strict';
  const { TRANSCRIPTS } = ENOCH_ENDPOINTS;
  global.TranscriptsService = {
    async byStudent(studentId) {
      const payload = await ApiClient.get(TRANSCRIPTS.STUDENT(studentId));
      return ApiClient.unwrapItem(payload);
    },
  };
})(window);
