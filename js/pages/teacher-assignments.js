(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [], subjectOptions = [], teacherOptions = [], sessionOptions = [];
    try {
      const [{ items: classes }, { items: subjects }, { items: teachers }, { items: sessions }] = await Promise.all([
        ClassesService.list({ pageSize: 100 }),
        SubjectsService.list({ pageSize: 200 }),
        TeachersService.list({ pageSize: 200 }),
        AcademicSessionsService.list({ pageSize: 50 }),
      ]);
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
      teacherOptions = teachers.map((t) => ({ value: t.id, label: `${t.firstName || t.user?.fullName || ''} ${t.lastName || ''}`.trim() || t.name }));
      sessionOptions = sessions.map((session) => ({ value: session.id, label: session.name }));
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
        { key: 'teacherName', label: 'Teacher', render: (r) => `<a href="teacher-details.html?id=${encodeURIComponent(r.staffId || r.staff?.id || '')}">${escapeHtml(r.teacherName || r.staff?.user?.fullName || r.teacher?.name || '—')}</a>` },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
      ],
      formFields: [
        { name: 'staffId', label: 'Teacher', type: 'select', required: true, options: teacherOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
      ],
      deleteMessage: () => 'Remove this teacher assignment?',
      buildRowActions: () => `<div class="row" style="gap:4px;justify-content:flex-end;"><button type="button" class="icon-link" data-action="delete" title="Remove">×</button></div>`,
    });

    const classTeacherBody = document.getElementById('class-teachers-tbody');
    const assignClassTeacherButton = document.getElementById('assign-class-teacher-btn');

    async function refreshClassTeachers() {
      classTeacherBody.innerHTML = '<tr><td colspan="4">Loading class teacher assignments…</td></tr>';
      try {
        const { items } = await TeacherAssignmentsService.listClassTeachers();
        if (!items.length) {
          classTeacherBody.innerHTML = '<tr><td colspan="4">No class teachers assigned yet.</td></tr>';
          return;
        }
        classTeacherBody.innerHTML = items.map((assignment) => `
          <tr data-class-teacher-id="${escapeHtml(assignment.id)}">
            <td data-label="Class">${escapeHtml(assignment.class?.name || '—')}</td>
            <td data-label="Teacher"><a href="teacher-details.html?id=${encodeURIComponent(assignment.staff?.id || assignment.staffId || '')}">${escapeHtml(assignment.staff?.user?.fullName || `${assignment.staff?.firstName || ''} ${assignment.staff?.lastName || ''}`.trim() || '—')}</a></td>
            <td data-label="Academic session">${escapeHtml(assignment.session?.name || '—')}</td>
            <td data-label="Actions" class="cell-actions"><button type="button" class="btn btn-outline-danger btn-sm" data-action="remove-class-teacher">Remove</button></td>
          </tr>
        `).join('');
      } catch (error) {
        classTeacherBody.innerHTML = `<tr><td colspan="4" class="text-danger">${escapeHtml(error.message || 'Could not load class teacher assignments.')}</td></tr>`;
      }
    }

    function openClassTeacherModal() {
      Modal.open({
        title: 'Assign class teacher',
        size: 'md',
        bodyHtml: `
          <form id="class-teacher-form" class="form">
            <div class="form-group"><label for="class-teacher-class">Class</label><select id="class-teacher-class" name="classId" required><option value="">Select class</option>${classOptions.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}</select></div>
            <div class="form-group"><label for="class-teacher-staff">Teacher</label><select id="class-teacher-staff" name="staffId" required><option value="">Select teacher</option>${teacherOptions.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}</select></div>
            <div class="form-group"><label for="class-teacher-session">Academic session</label><select id="class-teacher-session" name="sessionId" required><option value="">Select session</option>${sessionOptions.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}</select></div>
          </form>
        `,
        footerHtml: '<button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button><button type="submit" class="btn btn-primary" form="class-teacher-form">Save assignment</button>',
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          modalEl.querySelector('#class-teacher-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget).entries());
            try {
              await TeacherAssignmentsService.assignClassTeacher(data);
              Toast.success('Class teacher assignment saved.');
              Modal.close();
              await refreshClassTeachers();
            } catch (error) {
              Toast.error(error.message || 'Unable to save the class teacher assignment.');
            }
          });
        },
      });
    }

    classTeacherBody.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="remove-class-teacher"]');
      if (!button) return;
      const id = button.closest('[data-class-teacher-id]').dataset.classTeacherId;
      ConfirmDialog.open({
        title: 'Remove class teacher',
        message: 'Remove this class teacher assignment for the selected academic session?',
        confirmLabel: 'Remove assignment',
        tone: 'danger',
        onConfirm: async () => {
          try {
            await TeacherAssignmentsService.removeClassTeacher(id);
            Toast.success('Class teacher assignment removed.');
            await refreshClassTeachers();
          } catch (error) {
            Toast.error(error.message || 'Unable to remove the assignment.');
          }
        },
      });
    });
    assignClassTeacherButton.addEventListener('click', openClassTeacherModal);
    await refreshClassTeachers();
  });
})();
