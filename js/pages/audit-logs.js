(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    const table = DataTable.create({
      tbody: document.getElementById('audit-logs-tbody'),
      paginationEl: document.getElementById('audit-logs-pagination'),
      pageSize: 20,
      columns: [
        {
          key: 'user',
          label: 'Performed By',
          render: (row) => `<strong>${escapeHtml(row.user?.fullName || row.user?.email || 'System / Auto')}</strong>`
        },
        {
          key: 'role',
          label: 'Role',
          render: (row) => `<span class="badge badge-outline" style="border-color:var(--color-deep-navy); color:var(--color-deep-navy);">${escapeHtml(titleCaseFromEnum(row.user?.role || 'SYSTEM'))}</span>`
        },
        {
          key: 'action',
          label: 'Action',
          render: (row) => {
            const act = (row.action || '').toUpperCase();
            const tone = act.includes('APPROVE') ? 'success' : act.includes('REJECT') ? 'danger' : act.includes('DELETE') ? 'danger' : 'info';
            return `<span class="badge badge-${tone}">${escapeHtml(row.action || 'ACTION')}</span>`;
          }
        },
        {
          key: 'entity',
          label: 'Entity / Module',
          render: (row) => `<span style="font-weight:600; color:var(--color-deep-navy);">${escapeHtml(row.entity || '-')}</span>`
        },
        {
          key: 'description',
          label: 'Description',
          render: (row) => escapeHtml(row.description || '-')
        },
        {
          key: 'createdAt',
          label: 'Timestamp',
          render: (row) => `<span style="color:var(--text-muted); font-size:13px;">${formatDateTime(row.createdAt)}</span>`
        },
      ],
      fetchPage: async (page, filters) => {
        try {
          const res = await ApiClient.get(`/audit-logs?page=${page}&pageSize=20${filters.search ? `&search=${encodeURIComponent(filters.search)}` : ''}`);
          const data = res.data || res;
          return {
            items: data.data || data.items || [],
            total: data.pagination?.total || (data.data || []).length,
            page: data.pagination?.page || page,
            pageSize: data.pagination?.pageSize || 20,
          };
        } catch (err) {
          return { items: [], total: 0 };
        }
      },
      emptyMessage: 'No audit log entries recorded yet.',
    });

    table.load();

    const search = document.getElementById('audit-logs-search');
    if (search) {
      search.addEventListener('input', debounce(() => table.setFilters({ search: search.value.trim() }), 350));
    }
  });
})();
