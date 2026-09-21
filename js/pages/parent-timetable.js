(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const childSelect = document.getElementById('child-select');
    const tbody = document.getElementById('timetable-tbody');

    async function loadTimetable(childId) {
      if (!childId) { Loader.tableEmpty(tbody, 4, 'Select a child above.'); return; }
      Loader.tableLoading(tbody, 4, 'Loading timetable…');
      try {
        const student = await StudentsService.get(childId);
        const classId = student.classId || student.class?.id;
        if (!classId) { Loader.tableEmpty(tbody, 4, 'No class assigned yet.'); return; }
        const { items } = await TimetableService.byClass(classId, { pageSize: 100 });
        if (!items.length) { Loader.tableEmpty(tbody, 4, 'No timetable entries yet.'); return; }
        const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
        items.sort((a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek) || String(a.startTime).localeCompare(String(b.startTime)));
        tbody.innerHTML = items.map((r) => `
          <tr>
            <td>${escapeHtml(titleCaseFromEnum(r.dayOfWeek))}</td>
            <td>${formatTime(r.startTime)} – ${formatTime(r.endTime)}</td>
            <td>${escapeHtml(r.subjectName || r.subject?.name || '—')}</td>
            <td>${escapeHtml(r.teacherName || r.teacher?.name || '—')}</td>
          </tr>`).join('');
      } catch (err) {
        Loader.tableError(tbody, 4, err.message);
      }
    }

    const children = await ChildSelector.populate(childSelect);
    if (children.length) loadTimetable(childSelect.value);
    childSelect.addEventListener('change', () => loadTimetable(childSelect.value));
  });
})();
