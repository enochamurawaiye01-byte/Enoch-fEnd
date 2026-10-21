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

    const classOptionsById = new Map();
    try {
      const [{ items }, teacher] = await Promise.all([
        TeachersService.assignments(window.CurrentUser.id),
        TeachersService.getCurrent(),
      ]);
      const activeClassTeacherAssignments = (teacher.classTeacherAssignments || [])
        .filter((assignment) => assignment.session?.isActive)
      if (activeClassTeacherAssignments.length) {
        activeClassTeacherAssignments.forEach((assignment) => {
          const classId = assignment.classId || assignment.class?.id;
          if (classId) classOptionsById.set(classId, assignment.class?.name || '—');
        });
      } else {
        items.forEach((a) => {
          const classId = a.classId || a.class?.id;
          if (classId) classOptionsById.set(classId, a.className || a.class?.name || '—');
        });
      }
    } catch (error) {
      classSelect.innerHTML = '<option value="">Could not load your classes</option>';
      Loader.tableError(tbody, 3, error.message || 'Could not load your class assignments.');
      return;
    }

    const classOptions = Array.from(classOptionsById, ([value, label]) => ({ value, label }));
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
                <span class="avatar" style="overflow:hidden;">${s.profileImageUrl ? `<img src="${escapeHtml(s.profileImageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(initials(`${s.firstName || ''} ${s.lastName || ''}`))}</span>
                <div><a class="name" href="../../pages/admin/student-details.html?id=${encodeURIComponent(s.id)}">${escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`)}</a><div class="sub">${escapeHtml(s.registrationNumber || s.regNumber || '—')}</div></div>
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
