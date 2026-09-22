(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    const table = DataTable.create({
      tbody: document.getElementById('audit-logs-tbody'),
      paginationEl: document.getElementById('audit-logs-pagination'),
      columns: [
        { key: 'userName', label: 'User', render: (r) => escapeHtml(r.user?.fullName || 'System') },
        { key: 'action', label: 'Action', render: (r) => `<span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(r.action))}</span>` },
        { key: 'module', label: 'Module', render: (r) => escapeHtml(titleCaseFromEnum(r.entity || '')) },
        { key: 'details', label: 'Details', render: (r) => escapeHtml((r.description || '—').toString().slice(0, 80)) },
        { key: 'createdAt', label: 'Timestamp', render: (r) => formatDateTime(r.createdAt) },
      ],
      fetchPage: (page, filters) => AuditLogsService.list({ page, pageSize: 25, ...filters }),
      emptyMessage: 'No audit log entries found.',
    });
    table.load();

    const searchInput = document.getElementById('audit-search');
    const filterModule = document.getElementById('filter-module');
    const applyFilters = debounce(() => {
      table.setFilters({ search: searchInput.value.trim(), module: filterModule.value });
    }, 350);
    searchInput.addEventListener('input', applyFilters);
    filterModule.addEventListener('change', applyFilters);
  });
})();
