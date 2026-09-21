/**
 * Teacher → My Students. Pick one of the teacher's own classes, then
 * view the roster for that class (read-only — student record edits
 * happen in the Admin workspace).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const classSelect = document.getElementById('my-class-select');
    const tbody = document.getElementById('my-students-tbody');

    let classOptions = [];
    try {
      const { items } = await TeachersService.assignments(window.CurrentUser.id);
      const seen = new Set();
      items.forEach((a) => {
        const classId = a.classId || a.class?.id;
        if (classId && !seen.has(classId)) {
          seen.add(classId);
          classOptions.push({ value: classId, label: a.className || a.class?.name || '—' });
        }
      });
    } catch (e) { /* non-fatal */ }

    classSelect.innerHTML = classOptions.length
      ? '<option value="">Select a class…</option>' + classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')
      : '<option value="">No classes assigned</option>';

    async function loadRoster(classId) {
      if (!classId) {
        Loader.tableEmpty(tbody, 3, 'Select one of your classes to view its students.');
        return;
      }
      Loader.tableLoading(tbody, 3, 'Loading students…');
      try {
        const { items } = await ClassesService.students(classId, { pageSize: 200 });
        if (!items.length) {
          Loader.tableEmpty(tbody, 3, 'No students found in this class.');
          return;
        }
        tbody.innerHTML = items
          .map(
            (s) => `
          <tr>
            <td>
              <div class="avatar-cell">
                <span class="avatar">${escapeHtml(initials(`${s.firstName || ''} ${s.lastName || ''}`))}</span>
                <div><div class="name">${escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`)}</div><div class="sub">${escapeHtml(s.regNumber || '—')}</div></div>
              </div>
            </td>
            <td>${escapeHtml(s.email || '—')}</td>
            <td><span class="badge ${statusBadgeClass(s.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(s.status || 'ACTIVE'))}</span></td>
          </tr>`
          )
          .join('');
      } catch (err) {
        Loader.tableError(tbody, 3, err.message, () => loadRoster(classId));
      }
    }

    classSelect.addEventListener('change', () => loadRoster(classSelect.value));
    loadRoster('');
  });
})();
