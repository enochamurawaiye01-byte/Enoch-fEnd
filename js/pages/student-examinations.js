(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const tbody = document.getElementById('examinations-tbody');
    Loader.tableLoading(tbody, 4, 'Loading your examinations…');

    try {
      const student = await StudentsService.get(window.CurrentUser.id);
      const classId = student.classId || student.class?.id;
      if (!classId) {
        Loader.tableEmpty(tbody, 4, 'No class assigned yet.');
        return;
      }
      const { items } = await ExaminationsService.list({ classId, pageSize: 50 });
      if (!items.length) {
        Loader.tableEmpty(tbody, 4, 'No examinations scheduled yet.');
        return;
      }
      tbody.innerHTML = items
        .map(
          (e) => `
        <tr>
          <td><strong>${escapeHtml(e.title)}</strong></td>
          <td>${escapeHtml(e.subjectName || e.subject?.name || '—')}</td>
          <td>${formatDate(e.examDate)}</td>
          <td><span class="badge ${statusBadgeClass(e.status || 'SCHEDULED')}">${escapeHtml(titleCaseFromEnum(e.status || 'SCHEDULED'))}</span></td>
        </tr>`
        )
        .join('');
    } catch (err) {
      Loader.tableError(tbody, 4, err.message);
    }
  });
})();
