(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const childSelect = document.getElementById('child-select');
    const tbody = document.getElementById('assignments-tbody');

    async function loadAssignments(childId) {
      if (!childId) { Loader.tableEmpty(tbody, 4, 'Select a child above.'); return; }
      Loader.tableLoading(tbody, 4, 'Loading assignments…');
      try {
        const student = await StudentsService.get(childId);
        const classId = student.classId || student.class?.id;
        if (!classId) { Loader.tableEmpty(tbody, 4, 'No class assigned yet.'); return; }
        const { items } = await AssignmentsService.list({ classId, pageSize: 50 });
        if (!items.length) { Loader.tableEmpty(tbody, 4, 'No assignments issued yet.'); return; }
        tbody.innerHTML = items.map((a) => `
          <tr>
            <td><strong>${escapeHtml(a.title)}</strong></td>
            <td>${escapeHtml(a.subjectName || a.subject?.name || '—')}</td>
            <td>${formatDate(a.dueDate)}</td>
            <td>${escapeHtml(String(a.maxScore ?? '—'))}</td>
          </tr>`).join('');
      } catch (err) {
        Loader.tableError(tbody, 4, err.message);
      }
    }

    const children = await ChildSelector.populate(childSelect);
    if (children.length) loadAssignments(childSelect.value);
    childSelect.addEventListener('change', () => loadAssignments(childSelect.value));
  });
})();
