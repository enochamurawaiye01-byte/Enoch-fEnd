/**
 * Reusable pagination renderer, matching css/components/pagination.css
 * (.pagination, .pagination__info, .pagination__controls, .pagination__btn.active).
 * Usage: Pagination.render(containerEl, { page, totalPages, totalItems, pageSize }, onPageChange)
 */
(function (global) {
  'use strict';

  function render(container, { page = 1, totalPages = 1, totalItems = null, pageSize = null }, onPageChange) {
    if (!container) return;

    const info = totalItems !== null && pageSize
      ? `Showing ${Math.min((page - 1) * pageSize + 1, totalItems)}–${Math.min(page * pageSize, totalItems)} of ${totalItems}`
      : (totalItems !== null ? `${totalItems} record${totalItems === 1 ? '' : 's'}` : '');

    if (totalPages <= 1) {
      container.innerHTML = info ? `<div class="pagination"><span class="pagination__info">${info}</span></div>` : '';
      return;
    }

    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    let buttons = '';
    for (let p = start; p <= end; p++) {
      buttons += `<button type="button" class="pagination__btn ${p === page ? 'active' : ''}" data-page="${p}" aria-current="${p === page ? 'page' : 'false'}">${p}</button>`;
    }

    container.innerHTML = `
      <div class="pagination">
        <span class="pagination__info">${info}</span>
        <div class="pagination__controls">
          <button type="button" class="pagination__btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>
          ${buttons}
          <button type="button" class="pagination__btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Next page">›</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.pagination__btn[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.page);
        if (target >= 1 && target <= totalPages && target !== page) onPageChange(target);
      });
    });
  }

  global.Pagination = { render };
})(window);
