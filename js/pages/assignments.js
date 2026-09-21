(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [], subjectOptions = [];
    try {
      const [{ items: classes }, { items: subjects }] = await Promise.all([
        ClassesService.list({ pageSize: 100 }),
        SubjectsService.list({ pageSize: 200 }),
      ]);
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
    } catch (e) { /* non-fatal */ }

    SimpleCrudPage.init({
      tbody: document.getElementById('assignments-tbody'),
      paginationEl: document.getElementById('assignments-pagination'),
      searchInput: document.getElementById('assignments-search'),
      addBtn: document.getElementById('add-assignment-btn'),
      moduleKey: 'teaching',
      entityLabel: 'Assignment',
      service: AssignmentsService,
      modalSize: 'lg',
      columns: [
        { key: 'title', label: 'Title', render: (r) => `<strong>${escapeHtml(r.title)}</strong>` },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
        { key: 'maxScore', label: 'Max Score', render: (r) => escapeHtml(String(r.maxScore ?? '—')) },
      ],
      formFields: [
        { name: 'title', label: 'Assignment Title', required: true },
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'maxScore', label: 'Max Score', type: 'number' },
        { name: 'instructions', label: 'Instructions', type: 'textarea' },
      ],
      deleteMessage: (row) => `Delete assignment "${row.title}"?`,
    });
  });
})();
