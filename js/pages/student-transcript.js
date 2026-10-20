(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const container = document.getElementById('transcript-viewer');
    container.innerHTML = Loader.spinnerHtml('Loading your transcript…');

    try {
      const student = await StudentsService.me().catch(() => null);
      const transcript = await TranscriptsService.byStudent(student?.id || window.CurrentUser.id);
      ReportCardRenderer.render(container, student || { fullName: window.CurrentUser.firstName || '' }, transcript || {});
    } catch (err) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  });
})();
