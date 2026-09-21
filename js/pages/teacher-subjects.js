/**
 * Teacher → My Subjects. Derived from this teacher's own assignment
 * records (deduplicated by subject + class pairing).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const tbody = document.getElementById('my-subjects-tbody');
    Loader.tableLoading(tbody, 2, 'Loading your subjects…');
    try {
      const { items } = await TeachersService.assignments(window.CurrentUser.id);
      if (!items.length) {
        Loader.tableEmpty(tbody, 2, 'You have no subject assignments yet.');
        return;
      }
      tbody.innerHTML = items
        .map(
          (a) => `
        <tr>
          <td><strong>${escapeHtml(a.subjectName || a.subject?.name || '—')}</strong></td>
          <td>${escapeHtml(a.className || a.class?.name || '—')}</td>
        </tr>`
        )
        .join('');
    } catch (err) {
      Loader.tableError(tbody, 2, err.message);
    }
  });
})();
