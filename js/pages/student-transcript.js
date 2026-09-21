(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const container = document.getElementById('transcript-viewer');
    container.innerHTML = Loader.spinnerHtml('Loading your transcript…');

    try {
      const [student, transcript] = await Promise.all([
        StudentsService.get(window.CurrentUser.id).catch(() => null),
        TranscriptsService.byStudent(window.CurrentUser.id),
      ]);
      const records = (transcript && (transcript.records || transcript.results)) || [];
      const groupedByTerm = records.reduce((acc, r) => {
        const key = r.termName || r.term?.name || 'Unspecified Term';
        (acc[key] = acc[key] || []).push(r);
        return acc;
      }, {});

      container.innerHTML = `
        <div class="transcript-sheet">
          <div class="transcript-head">
            <div>
              <h2>${escapeHtml(student ? `${student.firstName || ''} ${student.lastName || ''}` : window.CurrentUser.firstName || '')}</h2>
              <p class="text-muted">Reg. No: ${escapeHtml((student && student.regNumber) || '—')} &middot; Class: ${escapeHtml((student && (student.className || student.class?.name)) || '—')}</p>
            </div>
            <button type="button" class="btn btn-secondary no-print" id="print-transcript-btn">Print</button>
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
                    ${rows.map((r) => `
                      <tr>
                        <td>${escapeHtml(r.subjectName || r.subject?.name || '—')}</td>
                        <td class="numeric">${escapeHtml(String(r.score ?? '—'))}</td>
                        <td>${escapeHtml(r.grade || '—')}</td>
                        <td>${escapeHtml(r.remarks || '—')}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>`
                  )
                  .join('')
              : '<div class="table-state"><p>No published results available yet.</p></div>'
          }
        </div>
      `;
      document.getElementById('print-transcript-btn')?.addEventListener('click', () => window.print());
    } catch (err) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  });
})();
