(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const childSelect = document.getElementById('child-select');
    const sessionSelect = document.getElementById('filter-session');
    const termSelect = document.getElementById('filter-term');
    let currentChildId = null;

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
      fetchPage: async (page) => {
        if (!currentChildId) return { items: [], total: 0, page, pageSize: 20 };
        const { items: reports } = await ParentsService.childResults(currentChildId, { sessionId: sessionSelect.value, termId: termSelect.value });
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
          remarks: entry.remark || entry.teacherComment,
        })));
        return { items, total: items.length, page, pageSize: 20 };
      },
      emptyMessage: 'Result Not Available — The school has not published this result yet.',
    });

    try {
      const { items: sessions } = await AcademicSessionsService.list({ pageSize: 50 });
      sessionSelect.innerHTML = '<option value="">All sessions</option>' + sessions.map((session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.name)}</option>`).join('');
    } catch (error) {
      Toast.error(error.message || 'Unable to load academic sessions.');
    }
    async function updateTerms() {
      try {
        const { items: terms } = await TermsService.list({ sessionId: sessionSelect.value || undefined, pageSize: 50 });
        termSelect.innerHTML = '<option value="">All terms</option>' + terms.map((term) => `<option value="${escapeHtml(term.id)}">${escapeHtml(titleCaseFromEnum(term.name || term.type))}</option>`).join('');
      } catch (error) {
        termSelect.innerHTML = '<option value="">Terms unavailable</option>';
      }
    }
    const children = await ChildSelector.populate(childSelect);
    if (children.length) {
      currentChildId = childSelect.value;
      table.load();
    } else {
      table.load();
    }
    childSelect.addEventListener('change', () => {
      currentChildId = childSelect.value;
      table.load();
    });
    sessionSelect.addEventListener('change', async () => { await updateTerms(); table.load(); });
    termSelect.addEventListener('change', () => table.load());
    await updateTerms();
  });
})();
