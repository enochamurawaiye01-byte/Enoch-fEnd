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
      tbody: document.getElementById('lessons-tbody'),
      paginationEl: document.getElementById('lessons-pagination'),
      searchInput: document.getElementById('lessons-search'),
      addBtn: document.getElementById('add-lesson-btn'),
      moduleKey: 'teaching',
      entityLabel: 'Lesson',
      service: LessonsService,
      modalSize: 'lg',
      columns: [
        { key: 'title', label: 'Title', render: (r) => `<strong>${escapeHtml(r.title)}</strong>` },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
      ],
      formFields: [
        { name: 'title', label: 'Lesson Title', required: true },
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'description', label: 'Notes / Objectives', type: 'textarea' },
      ],
      deleteMessage: (row) => `Delete lesson "${row.title}"?`,
    });
  });
})();
