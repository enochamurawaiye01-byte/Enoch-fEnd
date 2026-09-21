(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    SimpleCrudPage.init({
      tbody: document.getElementById('departments-tbody'),
      paginationEl: document.getElementById('departments-pagination'),
      searchInput: document.getElementById('departments-search'),
      addBtn: document.getElementById('add-department-btn'),
      moduleKey: 'academics',
      entityLabel: 'Department',
      service: DepartmentsService,
      columns: [
        { key: 'name', label: 'Department Name', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'headOfDepartment', label: 'Head of Department', render: (r) => escapeHtml(r.headOfDepartmentName || r.hod?.name || '—') },
        { key: 'subjectCount', label: 'Subjects', render: (r) => escapeHtml(String(r.subjectCount ?? '—')) },
      ],
      formFields: [
        { name: 'name', label: 'Department Name', required: true, placeholder: 'e.g. Sciences' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
      deleteMessage: (row) => `Delete "${row.name}"? Subjects linked to this department will need to be reassigned.`,
    });
  });
})();
