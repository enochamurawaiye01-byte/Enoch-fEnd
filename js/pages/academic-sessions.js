(function () {
  'use strict';

  function rowActions(row, canManage) {
    const activateBtn = row.status !== 'ACTIVE'
      ? `<button type="button" class="icon-link" data-action="activate" title="Activate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`
      : '';
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        ${canManage ? activateBtn : ''}
        ${canManage ? `
        <button type="button" class="icon-link" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>` : ''}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'academics');

    let table;
    table = SimpleCrudPage.init({
      tbody: document.getElementById('sessions-tbody'),
      paginationEl: document.getElementById('sessions-pagination'),
      addBtn: document.getElementById('add-session-btn'),
      moduleKey: 'academics',
      entityLabel: 'Academic Session',
      service: AcademicSessionsService,
      columns: [
        { key: 'name', label: 'Session', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'startDate', label: 'Start Date', render: (r) => formatDate(r.startDate) },
        { key: 'endDate', label: 'End Date', render: (r) => formatDate(r.endDate) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'name', label: 'Session Name', required: true, placeholder: 'e.g. 2026/2027' },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date', required: true },
      ],
      deleteMessage: (row) => `Delete session "${row.name}"?`,
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="activate"]')) {
          ConfirmDialog.open({
            title: 'Activate Session',
            message: 'Activating this session will make it the current active academic session school-wide.',
            confirmLabel: 'Activate',
            tone: 'warn',
            onConfirm: async () => {
              await AcademicSessionsService.activate(id);
              Toast.success('Academic session activated.');
              table.reload();
            },
          });
        }
      },
    });
  });
})();
