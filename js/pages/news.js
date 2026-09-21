(function () {
  'use strict';

  function rowActions(row, canManage) {
    const publishBtn = row.status !== 'PUBLISHED' && canManage
      ? `<button type="button" class="icon-link" data-action="publish" title="Publish">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`
      : '';
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        ${canManage ? `
        <button type="button" class="icon-link" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button type="button" class="icon-link" data-action="delete" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
        </button>` : ''}
        ${publishBtn}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'news');

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('news-tbody'),
      paginationEl: document.getElementById('news-pagination'),
      searchInput: document.getElementById('news-search'),
      addBtn: document.getElementById('add-news-btn'),
      moduleKey: 'news',
      entityLabel: 'News Post',
      service: NewsService,
      modalSize: 'lg',
      columns: [
        { key: 'title', label: 'Title', render: (r) => `<strong>${escapeHtml(r.title)}</strong>` },
        { key: 'featured', label: 'Featured', render: (r) => (r.featured ? '<span class="badge badge-outline">Featured</span>' : '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'DRAFT')}">${escapeHtml(titleCaseFromEnum(r.status || 'DRAFT'))}</span>` },
        { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'title', label: 'Title', required: true },
        { name: 'summary', label: 'Summary' },
        { name: 'content', label: 'Content', type: 'textarea', required: true },
        { name: 'featured', label: 'Featured', type: 'checkbox', checkboxLabel: 'Feature this post on the homepage' },
      ],
      deleteMessage: (row) => `Delete news post "${row.title}"?`,
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="publish"]')) {
          await NewsService.publish(id);
          Toast.success('News post published.');
          table.reload();
        }
      },
    });
  });
})();
