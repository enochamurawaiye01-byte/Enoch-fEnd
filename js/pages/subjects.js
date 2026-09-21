(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let departmentOptions = [];
    try {
      const { items } = await DepartmentsService.list({ pageSize: 100 });
      departmentOptions = items.map((d) => ({ value: d.id, label: d.name }));
    } catch (e) {
      // Non-fatal: department picker will just show no options.
    }

    SimpleCrudPage.init({
      tbody: document.getElementById('subjects-tbody'),
      paginationEl: document.getElementById('subjects-pagination'),
      searchInput: document.getElementById('subjects-search'),
      addBtn: document.getElementById('add-subject-btn'),
      moduleKey: 'academics',
      entityLabel: 'Subject',
      service: SubjectsService,
      columns: [
        { key: 'name', label: 'Subject Name', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'code', label: 'Code', render: (r) => escapeHtml(r.code || '—') },
        { key: 'department', label: 'Department', render: (r) => escapeHtml(r.departmentName || r.department?.name || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(r.status || 'ACTIVE'))}</span>` },
      ],
      formFields: [
        { name: 'name', label: 'Subject Name', required: true, placeholder: 'e.g. Mathematics' },
        { name: 'code', label: 'Subject Code', placeholder: 'e.g. MTH' },
        { name: 'departmentId', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
      deleteMessage: (row) => `Delete "${row.name}"? This cannot be undone.`,
    });
  });
})();
