(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const grid = document.getElementById('children-grid');
    grid.innerHTML = Loader.spinnerHtml('Loading your children…');
    try {
      const { items } = await ParentsService.children();
      if (!items.length) {
        grid.innerHTML = '<div class="table-state"><p>No children are linked to your account yet. Please contact the school office.</p></div>';
        return;
      }
      grid.innerHTML = `
        <div class="children-grid">
          ${items
            .map(
              (c) => `
            <a class="child-card" href="child-details.html?id=${encodeURIComponent(c.id)}">
              <span class="avatar" style="width:44px;height:44px;font-size:15px;">${escapeHtml(initials(`${c.firstName || ''} ${c.lastName || ''}`))}</span>
              <div>
                <div class="name">${escapeHtml(`${c.firstName || ''} ${c.lastName || ''}`)}</div>
                <div class="sub">${escapeHtml(c.className || c.class?.name || '—')} &middot; ${escapeHtml(c.regNumber || '—')}</div>
              </div>
            </a>`
            )
            .join('')}
        </div>
      `;
    } catch (err) {
      grid.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  });
})();
