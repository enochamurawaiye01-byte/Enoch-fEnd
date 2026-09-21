(function () {
  'use strict';

  let table;

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'settings');
    const addBtn = document.getElementById('add-document-btn');
    if (addBtn) addBtn.hidden = false; // documents can generally be uploaded by any authenticated user

    table = DataTable.create({
      tbody: document.getElementById('documents-tbody'),
      paginationEl: document.getElementById('documents-pagination'),
      columns: [
        { key: 'name', label: 'Document', render: (r) => `<strong>${escapeHtml(r.name || r.title)}</strong>` },
        { key: 'category', label: 'Category', render: (r) => escapeHtml(r.category || '—') },
        { key: 'uploadedAt', label: 'Uploaded', render: (r) => formatDate(r.createdAt || r.uploadedAt) },
      ],
      rowActions: (row) => `
        <div class="row" style="gap:4px; justify-content:flex-end;">
          <a class="icon-link" href="${escapeHtml(DocumentsService.downloadUrl(row.id))}" title="Download" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
          </a>
          <button type="button" class="icon-link" data-action="delete" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>`,
      fetchPage: (page, filters) => DocumentsService.list({ page, pageSize: 20, ...filters }),
      emptyMessage: 'No documents uploaded yet.',
      emptyActionHtml: '<button type="button" class="btn btn-primary btn-sm" data-action="empty-add">Upload Document</button>',
    });
    table.load();

    const searchInput = document.getElementById('documents-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => table.setFilters({ search: searchInput.value.trim() }), 350));
    }

    function openUploadModal() {
      Modal.open({
        title: 'Upload Document',
        bodyHtml: `
          <form id="doc-form" novalidate>
            <div class="form-group">
              <label class="form-label">Document Name <span class="required">*</span></label>
              <input type="text" name="name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" name="category" placeholder="e.g. Policy, Circular, Form" />
            </div>
            <div class="form-group">
              <label class="form-label">File <span class="required">*</span></label>
              <input type="file" name="file" id="doc-file-input" required />
            </div>
          </form>
        `,
        footerHtml: `<button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                     <button type="submit" form="doc-form" class="btn btn-primary" id="doc-save-btn">Upload</button>`,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          modalEl.querySelector('#doc-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = document.getElementById('doc-save-btn');
            Loader.setButtonLoading(btn, true, 'Uploading…');
            try {
              const formData = new FormData(form);
              await DocumentsService.create(formData);
              Toast.success('Document uploaded.');
              Modal.close();
              table.reload();
            } catch (err) {
              Toast.error(err.message || 'Unable to upload this document.');
            } finally {
              Loader.setButtonLoading(btn, false);
            }
          });
        },
      });
    }

    if (addBtn) addBtn.addEventListener('click', openUploadModal);
    document.getElementById('documents-tbody').addEventListener('click', (e) => {
      if (e.target.closest('[data-action="empty-add"]')) { openUploadModal(); return; }
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl || !e.target.closest('[data-action="delete"]')) return;
      ConfirmDialog.open({
        title: 'Delete Document',
        message: 'Delete this document? This cannot be undone.',
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: async () => {
          await DocumentsService.delete(rowEl.dataset.rowId);
          Toast.success('Document deleted.');
          table.reload();
        },
      });
    });
  });
})();
