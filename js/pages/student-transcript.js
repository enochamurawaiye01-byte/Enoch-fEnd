(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const container = document.getElementById('transcript-viewer');
    container.innerHTML = Loader.spinnerHtml('Loading your transcript…');

    try {
      const student = await StudentsService.me();
      if (!student?.id) throw new Error('Your student profile could not be found. Contact the school administrator.');
      const transcript = await TranscriptsService.byStudent(student.id);
      ReportCardRenderer.render(container, student, transcript || {});
    } catch (err) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  });
})();
