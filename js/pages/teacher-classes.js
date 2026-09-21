/**
 * Teacher → My Classes. Derived from this teacher's own assignment
 * records (deduplicated by class), since there is no separate
 * "my classes" endpoint in the API surface.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const tbody = document.getElementById('my-classes-tbody');
    Loader.tableLoading(tbody, 3, 'Loading your classes…');
    try {
      const { items } = await TeachersService.assignments(window.CurrentUser.id);
      const uniqueClasses = new Map();
      items.forEach((a) => {
        const classId = a.classId || a.class?.id;
        if (classId && !uniqueClasses.has(classId)) {
          uniqueClasses.set(classId, {
            name: a.className || a.class?.name || '—',
            subjects: [],
            studentCount: a.class?.studentCount,
          });
        }
        if (classId) uniqueClasses.get(classId).subjects.push(a.subjectName || a.subject?.name || '—');
      });

      const rows = Array.from(uniqueClasses.values());
      if (!rows.length) {
        Loader.tableEmpty(tbody, 3, 'You have no class assignments yet.');
        return;
      }
      tbody.innerHTML = rows
        .map(
          (r) => `
        <tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td>${r.subjects.map((s) => `<span class="tag" style="margin-right:4px;">${escapeHtml(s)}</span>`).join('')}</td>
          <td>${escapeHtml(r.studentCount !== undefined ? String(r.studentCount) : '—')}</td>
        </tr>`
        )
        .join('');
    } catch (err) {
      Loader.tableError(tbody, 3, err.message);
    }
  });
})();
