(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [], subjectOptions = [], teacherOptions = [];
    try {
      const [{ items: classes }, { items: subjects }, { items: teachers }] = await Promise.all([
        ClassesService.list({ pageSize: 100 }),
        SubjectsService.list({ pageSize: 200 }),
        TeachersService.list({ pageSize: 200 }),
      ]);
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
      teacherOptions = teachers.map((t) => ({ value: t.id, label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.name }));
    } catch (e) { /* non-fatal */ }

    SimpleCrudPage.init({
      tbody: document.getElementById('assignments-tbody'),
      paginationEl: document.getElementById('assignments-pagination'),
      searchInput: document.getElementById('assignments-search'),
      addBtn: document.getElementById('add-assignment-btn'),
      moduleKey: 'academics',
      entityLabel: 'Teacher Assignment',
      service: TeacherAssignmentsService,
      modalSize: 'md',
      columns: [
        { key: 'teacherName', label: 'Teacher', render: (r) => escapeHtml(r.teacherName || r.teacher?.name || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
      ],
      formFields: [
        { name: 'teacherId', label: 'Teacher', type: 'select', required: true, options: teacherOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
      ],
      deleteMessage: () => 'Remove this teacher assignment?',
    });
  });
})();
