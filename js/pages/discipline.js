(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let studentOptions = [];
    try {
      const { items } = await StudentsService.list({ pageSize: 200 });
      studentOptions = items.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
    } catch (e) { /* non-fatal */ }

    SimpleCrudPage.init({
      tbody: document.getElementById('discipline-tbody'),
      paginationEl: document.getElementById('discipline-pagination'),
      searchInput: document.getElementById('discipline-search'),
      addBtn: document.getElementById('add-discipline-btn'),
      moduleKey: 'discipline',
      entityLabel: 'Disciplinary Record',
      service: DisciplineService,
      modalSize: 'lg',
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'incident', label: 'Incident', render: (r) => escapeHtml((r.incident || r.description || '—').toString().slice(0, 60)) },
        { key: 'action', label: 'Action Taken', render: (r) => escapeHtml(r.action || '—') },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date || r.createdAt) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'OPEN')}">${escapeHtml(titleCaseFromEnum(r.status || 'OPEN'))}</span>` },
      ],
      formFields: [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'incident', label: 'Incident Description', type: 'textarea', required: true },
        { name: 'action', label: 'Action Taken', placeholder: 'e.g. Warning, Suspension, Detention' },
        { name: 'date', label: 'Date', type: 'date', required: true },
      ],
      deleteMessage: () => 'Delete this disciplinary record?',
    });
  });
})();
