(function () {
  'use strict';

  const ROLE_OPTIONS = Object.values(ENOCH_ROLES || {}).length
    ? Object.values(window.ENOCH_ROLES).map((r) => ({ value: r, label: titleCaseFromEnum(r) }))
    : [];

  function rowActions(row, canManage) {
    if (!canManage) return '';
    const toggleBtn = row.status === 'ACTIVE'
      ? `<button type="button" class="icon-link" data-action="deactivate" title="Deactivate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8"/></svg>
        </button>`
      : `<button type="button" class="icon-link" data-action="activate" title="Activate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`;
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        <button type="button" class="icon-link" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        ${toggleBtn}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'users');

    let table = SimpleCrudPage.init({
      tbody: document.getElementById('users-tbody'),
      paginationEl: document.getElementById('users-pagination'),
      searchInput: document.getElementById('users-search'),
      addBtn: document.getElementById('add-user-btn'),
      moduleKey: 'users',
      entityLabel: 'User',
      service: UsersService,
      columns: [
        {
          key: 'name', label: 'User', render: (r) => `
          <div class="avatar-cell">
            <span class="avatar">${escapeHtml(initials(`${r.firstName || ''} ${r.lastName || ''}`))}</span>
            <div><div class="name">${escapeHtml(`${r.firstName || ''} ${r.lastName || ''}`)}</div><div class="sub">${escapeHtml(r.email || r.username || '—')}</div></div>
          </div>`,
        },
        { key: 'role', label: 'Role', render: (r) => `<span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(r.role))}</span>` },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'firstName', label: 'First Name', required: true },
        { name: 'lastName', label: 'Last Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'username', label: 'Username' },
        { name: 'role', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS },
        { name: 'password', label: 'Temporary Password', type: 'password', help: 'Leave blank when editing to keep the current password.' },
      ],
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="activate"]')) {
          await UsersService.activate(id);
          Toast.success('User activated.');
          table.reload();
        } else if (e.target.closest('[data-action="deactivate"]')) {
          ConfirmDialog.open({
            title: 'Deactivate User',
            message: 'This user will lose access to the ERP until reactivated.',
            confirmLabel: 'Deactivate',
            tone: 'danger',
            onConfirm: async () => {
              await UsersService.deactivate(id);
              Toast.success('User deactivated.');
              table.reload();
            },
          });
        }
      },
    });
  });
})();
