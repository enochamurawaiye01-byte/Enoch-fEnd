(function () {
  'use strict';

  function renderTranscript(container, student, transcript) {
    const records = transcript.records || transcript.results || [];
    const groupedByTerm = records.reduce((acc, r) => {
      const key = r.termName || r.term?.name || 'Unspecified Term';
      (acc[key] = acc[key] || []).push(r);
      return acc;
    }, {});

    container.innerHTML = `
      <div class="transcript-sheet">
        <div class="transcript-head">
          <div>
            <h2>${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`)}</h2>
            <p class="text-muted">Reg. No: ${escapeHtml(student.regNumber || '—')} &middot; Class: ${escapeHtml(student.className || student.class?.name || '—')}</p>
          </div>
          <button type="button" class="btn btn-secondary no-print" id="print-transcript-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>

        ${
          Object.keys(groupedByTerm).length
            ? Object.entries(groupedByTerm)
                .map(
                  ([term, rows]) => `
              <h3 class="transcript-term-title">${escapeHtml(titleCaseFromEnum(term))}</h3>
              <table class="data-table">
                <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Remarks</th></tr></thead>
                <tbody>
                  ${rows
                    .map(
                      (r) => `
                    <tr>
                      <td>${escapeHtml(r.subjectName || r.subject?.name || '—')}</td>
                      <td class="numeric">${escapeHtml(String(r.score ?? '—'))}</td>
                      <td>${escapeHtml(r.grade || '—')}</td>
                      <td>${escapeHtml(r.remarks || '—')}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
                )
                .join('')
            : '<div class="table-state"><p>No published results available for this student yet.</p></div>'
        }
      </div>
    `;

    document.getElementById('print-transcript-btn')?.addEventListener('click', () => window.print());
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
            <span class="text-muted text-small">${escapeHtml(s.regNumber || '')} &middot; ${escapeHtml(s.className || s.class?.name || '')}</span>
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
