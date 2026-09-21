(function () {
  'use strict';

  let table;

  function viewAlbum(album, images) {
    const grid = images.length
      ? `<div class="gallery-grid">${images.map((img) => `<img src="${escapeHtml(img.url || img.imageUrl)}" alt="${escapeHtml(img.caption || album.name)}" />`).join('')}</div>`
      : '<div class="table-state"><p>No images in this album yet.</p></div>';
    Modal.open({
      title: album.name,
      size: 'lg',
      bodyHtml: grid,
      footerHtml: `<button type="button" class="btn btn-secondary" data-action="close">Close</button>`,
      onMount: (modalEl) => modalEl.querySelector('[data-action="close"]').addEventListener('click', Modal.close),
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'gallery');
    const addBtn = document.getElementById('add-album-btn');
    if (addBtn) addBtn.hidden = !canManage;

    table = DataTable.create({
      tbody: document.getElementById('albums-tbody'),
      paginationEl: document.getElementById('albums-pagination'),
      columns: [
        { key: 'name', label: 'Album', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'imageCount', label: 'Images', render: (r) => escapeHtml(String(r.imageCount ?? '—')) },
        { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
      ],
      rowActions: (row) => `
        <div class="row" style="gap:4px; justify-content:flex-end;">
          <button type="button" class="icon-link" data-action="view" title="View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          </button>
          ${canManage ? `
          <button type="button" class="icon-link" data-action="delete" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
          </button>` : ''}
        </div>`,
      fetchPage: (page) => GalleryService.albums({ page, pageSize: 20 }),
      emptyMessage: 'No photo albums yet.',
      emptyActionHtml: canManage ? '<button type="button" class="btn btn-primary btn-sm" data-action="empty-add">Add Album</button>' : '',
    });
    table.load();

    function openAlbumModal() {
      Modal.open({
        title: 'Add Album',
        bodyHtml: `
          <form id="album-form" novalidate>
            <div class="form-group">
              <label class="form-label">Album Name <span class="required">*</span></label>
              <input type="text" name="name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea name="description"></textarea>
            </div>
          </form>
        `,
        footerHtml: `<button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                     <button type="submit" form="album-form" class="btn btn-primary" id="album-save-btn">Add Album</button>`,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          modalEl.querySelector('#album-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.target).entries());
            const btn = document.getElementById('album-save-btn');
            Loader.setButtonLoading(btn, true, 'Saving…');
            try {
              await GalleryService.createAlbum(values);
              Toast.success('Album created.');
              Modal.close();
              table.reload();
            } catch (err) {
              Toast.error(err.message || 'Unable to create this album.');
            } finally {
              Loader.setButtonLoading(btn, false);
            }
          });
        },
      });
    }

    if (addBtn) addBtn.addEventListener('click', openAlbumModal);

    document.getElementById('albums-tbody').addEventListener('click', async (e) => {
      if (e.target.closest('[data-action="empty-add"]')) { openAlbumModal(); return; }
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl) return;
      const id = rowEl.dataset.rowId;

      if (e.target.closest('[data-action="view"]')) {
        try {
          const album = await GalleryService.getAlbum(id);
          const { items } = await GalleryService.images(id);
          viewAlbum(album, items);
        } catch (err) {
          Toast.error(err.message || 'Unable to load this album.');
        }
      } else if (e.target.closest('[data-action="delete"]')) {
        ConfirmDialog.open({
          title: 'Delete Album',
          message: 'Delete this album and all its images? This cannot be undone.',
          confirmLabel: 'Delete',
          tone: 'danger',
          onConfirm: async () => {
            await GalleryService.deleteAlbum(id);
            Toast.success('Album deleted.');
            table.reload();
          },
        });
      }
    });
  });
})();
