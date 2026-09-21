(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const table = DataTable.create({
      tbody: document.getElementById('results-tbody'),
      paginationEl: document.getElementById('results-pagination'),
      columns: [
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'termName', label: 'Term', render: (r) => escapeHtml(titleCaseFromEnum(r.termName || r.term?.name || '')) },
        { key: 'score', label: 'Score', render: (r) => escapeHtml(String(r.score ?? '—')) },
        { key: 'grade', label: 'Grade', render: (r) => escapeHtml(r.grade || '—') },
        { key: 'remarks', label: 'Remarks', render: (r) => escapeHtml(r.remarks || '—') },
      ],
      fetchPage: (page, filters) => ResultsService.byStudent(window.CurrentUser.id, { page, pageSize: 20, ...filters }),
      emptyMessage: 'No published results yet.',
    });
    table.load();

    const filterTerm = document.getElementById('filter-term');
    if (filterTerm) {
      try {
        const { items } = await TermsService.list({ pageSize: 50 });
        filterTerm.innerHTML = '<option value="">All Terms</option>' +
          items.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(titleCaseFromEnum(t.name))} — ${escapeHtml(t.academicSessionName || t.academicSession?.name || '')}</option>`).join('');
      } catch (e) { /* non-fatal */ }
      filterTerm.addEventListener('change', () => table.setFilters({ termId: filterTerm.value }));
    }
  });
})();
