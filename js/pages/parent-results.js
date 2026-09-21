(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const childSelect = document.getElementById('child-select');
    let currentChildId = null;

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
      fetchPage: (page) => (currentChildId ? ResultsService.byStudent(currentChildId, { page, pageSize: 20 }) : Promise.resolve({ items: [], meta: null })),
      emptyMessage: 'No published results yet.',
    });

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
  });
})();
