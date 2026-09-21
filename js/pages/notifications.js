(function () {
  'use strict';

  let table;

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    table = DataTable.create({
      tbody: document.getElementById('notifications-tbody'),
      paginationEl: document.getElementById('notifications-pagination'),
      columns: [
        {
          key: 'title', label: 'Notification', render: (r) => `
          <div>
            <div class="${r.readAt || r.isRead ? '' : 'text-strong'}">${escapeHtml(r.title || r.message || 'Notification')}</div>
            ${r.body ? `<div class="text-muted text-small">${escapeHtml(r.body)}</div>` : ''}
          </div>`,
        },
        { key: 'status', label: 'Status', render: (r) => (r.readAt || r.isRead ? '<span class="badge badge-outline">Read</span>' : '<span class="badge badge-warning">Unread</span>') },
        { key: 'createdAt', label: 'Received', render: (r) => timeAgo(r.createdAt) },
      ],
      rowActions: (row) => (row.readAt || row.isRead ? '' : `<button type="button" class="btn btn-secondary btn-sm" data-action="mark-read">Mark Read</button>`),
      fetchPage: (page) => NotificationsService.list({ page, pageSize: 20 }),
      emptyMessage: 'You have no notifications.',
    });
    table.load();

    document.getElementById('mark-all-read-page-btn')?.addEventListener('click', async () => {
      await NotificationsService.markAllRead();
      Toast.success('All notifications marked as read.');
      table.reload();
    });

    document.getElementById('notifications-tbody').addEventListener('click', async (e) => {
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl || !e.target.closest('[data-action="mark-read"]')) return;
      await NotificationsService.markRead(rowEl.dataset.rowId);
      table.reload();
    });
  });
})();
