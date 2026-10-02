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
        { key: 'scores', label: '1st CA / 2nd CA / Exam', render: (r) => `${escapeHtml(String(r.firstTest ?? '—'))} / ${escapeHtml(String(r.secondTest ?? '—'))} / ${escapeHtml(String(r.exam ?? '—'))}` },
        { key: 'score', label: 'Total', render: (r) => escapeHtml(String(r.score ?? '—')) },
        { key: 'grade', label: 'Grade', render: (r) => escapeHtml(r.grade || '—') },
        { key: 'remarks', label: 'Remarks', render: (r) => escapeHtml(r.remarks || '—') },
      ],
      fetchPage: async (page, filters) => {
        const { items: reports } = await ReportCardsService.list({ sessionId: filters.sessionId, termId: filters.termId, published: true });
        const items = reports.flatMap((report) => (report.entries || []).map((entry) => ({
          id: entry.id,
          subject: entry.subject,
          subjectName: entry.subject?.name,
          term: report.term,
          termName: report.term?.name,
          firstTest: entry.firstTest,
          secondTest: entry.secondTest,
          exam: entry.exam,
          score: entry.total,
          grade: entry.grade,
          remarks: entry.remark || entry.teacherComment
        })));
        return { items, total: items.length, page, pageSize: 20 };
      },
      emptyMessage: 'No published results yet.',
    });
    table.load();

    const filterSession = document.getElementById('filter-session');
    const filterTerm = document.getElementById('filter-term');
    if (filterSession) {
      try {
        const { items } = await AcademicSessionsService.list({ pageSize: 50 });
        filterSession.innerHTML = '<option value="">All sessions</option>' +
          items.map((session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.name)}</option>`).join('');
      } catch (e) { /* non-fatal */ }
    }
    async function updateTerms() {
      if (!filterTerm) return;
      try {
        const { items } = await TermsService.list({ sessionId: filterSession?.value || undefined, pageSize: 50 });
        filterTerm.innerHTML = '<option value="">All terms</option>' +
          items.map((term) => `<option value="${escapeHtml(term.id)}">${escapeHtml(titleCaseFromEnum(term.name || term.type))}</option>`).join('');
      } catch (error) {
        filterTerm.innerHTML = '<option value="">Terms unavailable</option>';
      }
    }
    if (filterSession) filterSession.addEventListener('change', async () => { await updateTerms(); table.setFilters({ sessionId: filterSession.value, termId: '' }); });
    if (filterTerm) filterTerm.addEventListener('change', () => table.setFilters({ sessionId: filterSession?.value || '', termId: filterTerm.value }));
    await updateTerms();
  });
})();
