(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let departmentOptions = [];
    try {
      const { items } = await DepartmentsService.list({ pageSize: 100 });
      departmentOptions = items.map((d) => ({ value: d.id, label: d.name }));
    } catch (e) { /* non-fatal */ }

    let table;
    const rowActions = (row) => `<div class="row" style="gap:4px;justify-content:flex-end;"><button type="button" class="icon-link" data-action="${row.status === 'ACTIVE' ? 'deactivate' : 'activate'}" title="${row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}">${row.status === 'ACTIVE' ? '×' : '✓'}</button><button type="button" class="icon-link" data-action="edit" title="Edit">✎</button></div>`;
    table = SimpleCrudPage.init({
      tbody: document.getElementById('teachers-tbody'),
      paginationEl: document.getElementById('teachers-pagination'),
      searchInput: document.getElementById('teachers-search'),
      addBtn: document.getElementById('add-teacher-btn'),
      moduleKey: 'teachers',
      entityLabel: 'Teacher',
      service: TeachersService,
      buildRowActions: rowActions,
      columns: [
        {
          key: 'name', label: 'Teacher', render: (r) => `
          <div class="avatar-cell">
            <span class="avatar">${escapeHtml(initials(`${r.firstName || ''} ${r.lastName || ''}`))}</span>
            <div><div class="name">${escapeHtml(`${r.firstName || ''} ${r.lastName || ''}`)}</div><div class="sub">${escapeHtml(r.email || '—')}</div></div>
          </div>`,
        },
        { key: 'department', label: 'Department', render: (r) => escapeHtml(r.departmentName || r.department?.name || '—') },
        { key: 'phone', label: 'Phone', render: (r) => escapeHtml(r.phone || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(r.status || 'ACTIVE'))}</span>` },
      ],
      formFields: [
        { name: 'firstName', label: 'First Name', required: true },
        { name: 'lastName', label: 'Last Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number' },
        { name: 'departmentId', label: 'Department', type: 'select', options: departmentOptions },
        { name: 'qualification', label: 'Qualification' },
      ],
      deleteMessage: (row) => `Delete teacher "${row.firstName} ${row.lastName}"? Existing assignments will need reassignment.`,
      onRowAction: async (event, id) => {
        if (event.target.closest('[data-action="activate"]')) {
          await TeachersService.activate(id);
          Toast.success('Teacher activated.');
          table.reload();
        } else if (event.target.closest('[data-action="deactivate"]')) {
          await TeachersService.deactivate(id);
          Toast.success('Teacher deactivated.');
          table.reload();
        }
      },
    });
  });
})();
