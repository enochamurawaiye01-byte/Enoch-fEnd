(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [];
    let subjectOptions = [];
    try {
      const [{ items: classes }, { items: subjects }] = await Promise.all([
        ClassesService.list({ pageSize: 100 }),
        SubjectsService.list({ pageSize: 200 }),
      ]);
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
    } catch (e) { /* non-fatal */ }

    const filterClass = document.getElementById('filter-class');
    if (filterClass) {
      filterClass.innerHTML = '<option value="">All Classes</option>' +
        classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('class-subjects-tbody'),
      paginationEl: document.getElementById('class-subjects-pagination'),
      addBtn: document.getElementById('add-class-subject-btn'),
      moduleKey: 'academics',
      entityLabel: 'Class Subject',
      service: ClassSubjectsService,
      columns: [
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'compulsory', label: 'Type', render: (r) => `<span class="badge badge-outline">${r.isCompulsory ? 'Compulsory' : 'Elective'}</span>` },
      ],
      formFields: [
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'isCompulsory', label: 'Compulsory Subject', type: 'checkbox', checkboxLabel: 'This subject is compulsory for the class' },
      ],
      deleteMessage: () => 'Remove this subject from the class?',
      extraFilters: () => ({ classId: filterClass ? filterClass.value : '' }),
    });

    if (filterClass) filterClass.addEventListener('change', () => table.setFilters({ classId: filterClass.value }));
  });
})();
