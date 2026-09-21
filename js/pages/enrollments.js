(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let studentOptions = [], classOptions = [], sessionOptions = [];
    try {
      const [{ items: students }, { items: classes }, { items: sessions }] = await Promise.all([
        StudentsService.list({ pageSize: 200 }),
        ClassesService.list({ pageSize: 100 }),
        AcademicSessionsService.list({ pageSize: 50 }),
      ]);
      studentOptions = students.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      sessionOptions = sessions.map((s) => ({ value: s.id, label: s.name }));
    } catch (e) { /* non-fatal */ }

    const filterSession = document.getElementById('filter-session');
    if (filterSession) {
      filterSession.innerHTML = '<option value="">All Sessions</option>' +
        sessionOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('enrollments-tbody'),
      paginationEl: document.getElementById('enrollments-pagination'),
      searchInput: document.getElementById('enrollments-search'),
      addBtn: document.getElementById('add-enrollment-btn'),
      moduleKey: 'academics',
      entityLabel: 'Enrollment',
      service: EnrollmentsService,
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'sessionName', label: 'Academic Session', render: (r) => escapeHtml(r.academicSessionName || r.academicSession?.name || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(r.status || 'ACTIVE'))}</span>` },
      ],
      formFields: [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
        { name: 'academicSessionId', label: 'Academic Session', type: 'select', required: true, options: sessionOptions },
      ],
      deleteMessage: () => 'Remove this enrollment record?',
      extraFilters: () => ({ academicSessionId: filterSession ? filterSession.value : '' }),
    });

    if (filterSession) filterSession.addEventListener('change', () => table.setFilters({ academicSessionId: filterSession.value }));
  });
})();
