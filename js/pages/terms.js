(function () {
  'use strict';

  function rowActions(row, canManage) {
    const activateBtn = row.status !== 'ACTIVE'
      ? `<button type="button" class="icon-link" data-action="activate" title="Activate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`
      : `<button type="button" class="icon-link" data-action="close" title="Close term">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8"/></svg>
        </button>`;
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        ${canManage ? activateBtn : ''}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'academics');

    let sessionOptions = [];
    try {
      const { items } = await AcademicSessionsService.list({ pageSize: 50 });
      sessionOptions = items.map((s) => ({ value: s.id, label: s.name }));
    } catch (e) { /* non-fatal */ }

    const filterSession = document.getElementById('filter-session');
    if (filterSession) {
      filterSession.innerHTML = '<option value="">All Sessions</option>' +
        sessionOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    let table = SimpleCrudPage.init({
      tbody: document.getElementById('terms-tbody'),
      paginationEl: document.getElementById('terms-pagination'),
      addBtn: document.getElementById('add-term-btn'),
      moduleKey: 'academics',
      entityLabel: 'Term',
      service: TermsService,
      columns: [
        { key: 'name', label: 'Term', render: (r) => `<strong>${escapeHtml(titleCaseFromEnum(r.name))}</strong>` },
        { key: 'session', label: 'Academic Session', render: (r) => escapeHtml(r.academicSessionName || r.academicSession?.name || '—') },
        { key: 'startDate', label: 'Start Date', render: (r) => formatDate(r.startDate) },
        { key: 'endDate', label: 'End Date', render: (r) => formatDate(r.endDate) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'academicSessionId', label: 'Academic Session', type: 'select', required: true, options: sessionOptions },
        { name: 'name', label: 'Term', type: 'select', required: true, options: [
          { value: 'FIRST', label: 'First Term' },
          { value: 'SECOND', label: 'Second Term' },
          { value: 'THIRD', label: 'Third Term' },
        ] },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date', required: true },
      ],
      onFormValues: (values) => ({
        ...values,
        type: values.name,
        startDate: values.startDate ? `${values.startDate}T00:00:00.000Z` : values.startDate,
        endDate: values.endDate ? `${values.endDate}T23:59:59.999Z` : values.endDate,
      }),
      deleteMessage: (row) => `Delete ${titleCaseFromEnum(row.name)} term?`,
      extraFilters: () => ({ academicSessionId: filterSession ? filterSession.value : '' }),
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="activate"]')) {
          ConfirmDialog.open({
            title: 'Activate Term',
            message: 'Activating this term will make it the current active term school-wide.',
            confirmLabel: 'Activate',
            tone: 'warn',
            onConfirm: async () => {
              await TermsService.activate(id);
              Toast.success('Term activated.');
              table.reload();
            },
          });
        } else if (e.target.closest('[data-action="close"]')) {
          ConfirmDialog.open({
            title: 'Close Term',
            message: 'Closing this term will lock it from further result and attendance entry.',
            confirmLabel: 'Close Term',
            tone: 'danger',
            onConfirm: async () => {
              await TermsService.close(id);
              Toast.success('Term closed.');
              table.reload();
            },
          });
        }
      },
    });

    if (filterSession) {
      filterSession.addEventListener('change', () => table.setFilters({ academicSessionId: filterSession.value }));
    }
  });
})();
