(function () {
  'use strict';

  function renderTranscript(container, student, transcript) {
    ReportCardRenderer.render(container, student, transcript);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    const searchInput = document.getElementById('transcript-student-search');
    const resultsList = document.getElementById('transcript-search-results');
    const viewer = document.getElementById('transcript-viewer');

    const search = debounce(async () => {
      const q = searchInput.value.trim();
      if (!q) {
        resultsList.innerHTML = '';
        resultsList.hidden = true;
        return;
      }
      resultsList.hidden = false;
      resultsList.innerHTML = Loader.spinnerHtml('Searching…');
      try {
        const { items } = await StudentsService.list({ search: q, pageSize: 10 });
        if (!items.length) {
          resultsList.innerHTML = '<div class="table-state"><p>No matching students.</p></div>';
          return;
        }
        resultsList.innerHTML = items
          .map(
            (s) => `
          <button type="button" class="search-result-item" data-student-id="${escapeHtml(s.id)}">
            <strong>${escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`)}</strong>
            <span class="text-muted text-small">${escapeHtml(s.registrationNumber || s.regNumber || '')} &middot; ${escapeHtml(s.className || s.class?.name || '')}</span>
          </button>`
          )
          .join('');
      } catch (err) {
        resultsList.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
      }
    }, 350);

    searchInput.addEventListener('input', search);

    resultsList.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-student-id]');
      if (!btn) return;
      resultsList.hidden = true;
      searchInput.value = btn.textContent.trim();
      viewer.innerHTML = Loader.spinnerHtml('Loading transcript…');
      try {
        const student = await StudentsService.get(btn.dataset.studentId);
        const transcript = await TranscriptsService.byStudent(btn.dataset.studentId);
        renderTranscript(viewer, student, transcript || {});
      } catch (err) {
        viewer.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
      }
    });
  });
})();
