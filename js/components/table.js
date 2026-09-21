/**
 * DataTable — lightweight reusable table controller for server-driven
 * listing pages: loading/empty/error states + row rendering + pagination.
 * Expects markup structured per css/components/tables.css:
 *   <div class="table-wrap">
 *     <div class="table-toolbar">...filters/search...</div>
 *     <div class="table-scroll"><table class="data-table">
 *       <thead>...</thead><tbody id="...-tbody"></tbody>
 *     </table></div>
 *     <div id="...-pagination"></div>
 *   </div>
 *
 * Usage:
 *   const table = DataTable.create({
 *     tbody, paginationEl, columns: [...], fetchPage: (page, filters) => Service.list({page,...filters}),
 *     emptyMessage, emptyActionHtml, rowActions,
 *   });
 *   table.load();
 */
(function (global) {
  'use strict';

  function create({ tbody, paginationEl, columns, fetchPage, emptyMessage, emptyActionHtml, rowActions, pageSize = 20 }) {
    let currentPage = 1;
    let currentFilters = {};

    function colspan() {
      return columns.length + (rowActions ? 1 : 0);
    }

    function renderRows(items) {
      tbody.innerHTML = items
        .map((row) => {
          const cells = columns
            .map((col) => `<td data-label="${escapeHtml(col.label)}" class="${col.cellClass || ''}">${col.render ? col.render(row) : escapeHtml(row[col.key] ?? '—')}</td>`)
            .join('');
          const actionsCell = rowActions ? `<td class="cell-actions" data-label="Actions">${rowActions(row)}</td>` : '';
          return `<tr data-row-id="${escapeHtml(row.id ?? '')}">${cells}${actionsCell}</tr>`;
        })
        .join('');
    }

    async function load(page = currentPage, filters = currentFilters) {
      currentPage = page;
      currentFilters = filters;
      Loader.tableLoading(tbody, colspan(), 'Loading records…');
      try {
        const result = await fetchPage(page, filters);
        const items = result.items || [];
        const meta = result.meta || {};
        if (!items.length) {
          Loader.tableEmpty(tbody, colspan(), emptyMessage, emptyActionHtml);
          if (paginationEl) paginationEl.innerHTML = '';
          return;
        }
        renderRows(items);
        if (paginationEl) {
          const totalPages = meta.totalPages || meta.lastPage || Math.ceil((meta.total || items.length) / (meta.pageSize || pageSize)) || 1;
          Pagination.render(
            paginationEl,
            { page: meta.page || page, totalPages, totalItems: meta.total ?? null, pageSize: meta.pageSize || pageSize },
            (p) => load(p, currentFilters)
          );
        }
      } catch (err) {
        Loader.tableError(tbody, colspan(), err.message, () => load(currentPage, currentFilters));
      }
    }

    return {
      load,
      reload: () => load(currentPage, currentFilters),
      setFilters: (filters) => load(1, filters),
      getState: () => ({ page: currentPage, filters: currentFilters }),
    };
  }

  global.DataTable = { create };
})(window);
