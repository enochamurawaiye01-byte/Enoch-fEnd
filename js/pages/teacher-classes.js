/**
 * Teacher → My Classes. Combines subject assignments and class-teacher
 * assignments from the current teacher's own profile.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const tbody = document.getElementById('my-classes-tbody');
    Loader.tableLoading(tbody, 4, 'Loading your classes…');
    try {
      const [{ items }, teacher] = await Promise.all([
        TeachersService.assignments(window.CurrentUser.id),
        TeachersService.getCurrent(),
      ]);
      const uniqueClasses = new Map();
      items.forEach((a) => {
        const classId = a.classId || a.class?.id;
        if (classId && !uniqueClasses.has(classId)) {
          uniqueClasses.set(classId, {
            name: a.className || a.class?.name || '—',
            subjects: [],
            studentCount: a.class?.studentCount,
            isClassTeacher: false,
          });
        }
        if (classId) uniqueClasses.get(classId).subjects.push(a.subjectName || a.subject?.name || '—');
      });
      (teacher.classTeacherAssignments || []).forEach((assignment) => {
        const classId = assignment.classId || assignment.class?.id;
        if (!classId) return;
        const schoolClass = uniqueClasses.get(classId) || {
          name: assignment.class?.name || '—',
          subjects: [],
          studentCount: assignment.class?.studentCount,
          isClassTeacher: false,
        };
        if (assignment.session?.isActive) schoolClass.isClassTeacher = true;
        uniqueClasses.set(classId, schoolClass);
      });

      const rows = Array.from(uniqueClasses.values());
      if (!rows.length) {
        Loader.tableEmpty(tbody, 4, 'You have no class assignments yet.');
        return;
      }
      tbody.innerHTML = rows
        .map(
          (r) => `
        <tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td>${r.isClassTeacher ? '<span class="tag">Class Teacher</span>' : 'Subject Teacher'}</td>
          <td>${r.subjects.map((s) => `<span class="tag" style="margin-right:4px;">${escapeHtml(s)}</span>`).join('')}</td>
          <td>${escapeHtml(r.studentCount !== undefined ? String(r.studentCount) : '—')}</td>
        </tr>`
        )
        .join('');
    } catch (err) {
      Loader.tableError(tbody, 4, err.message);
    }
  });
})();
