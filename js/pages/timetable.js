(function () {
  'use strict';

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

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

    const filterClass = document.getElementById('filter-class');
    if (filterClass) {
      filterClass.innerHTML = '<option value="">All Classes</option>' +
        classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('timetable-tbody'),
      paginationEl: document.getElementById('timetable-pagination'),
      addBtn: document.getElementById('add-timetable-btn'),
      moduleKey: 'teaching',
      entityLabel: 'Timetable Entry',
      service: TimetableService,
      columns: [
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'dayOfWeek', label: 'Day', render: (r) => escapeHtml(titleCaseFromEnum(r.dayOfWeek)) },
        { key: 'time', label: 'Time', render: (r) => `${formatTime(r.startTime)} – ${formatTime(r.endTime)}` },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'teacherName', label: 'Teacher', render: (r) => escapeHtml(r.teacherName || r.teacher?.name || '—') },
      ],
      formFields: [
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
        { name: 'dayOfWeek', label: 'Day of Week', type: 'select', required: true, options: DAYS.map((d) => ({ value: d, label: titleCaseFromEnum(d) })) },
        { name: 'startTime', label: 'Start Time', type: 'time', required: true },
        { name: 'endTime', label: 'End Time', type: 'time', required: true },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'teacherId', label: 'Teacher', type: 'select', options: teacherOptions },
      ],
      deleteMessage: () => 'Remove this timetable entry?',
      extraFilters: () => ({ classId: filterClass ? filterClass.value : '' }),
    });

    if (filterClass) filterClass.addEventListener('change', () => table.setFilters({ classId: filterClass.value }));
  });
})();
