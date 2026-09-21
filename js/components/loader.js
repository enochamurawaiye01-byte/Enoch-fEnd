/**
 * Loader helpers - consistent loading/empty/error UI, matching
 * css/components/loader.css and css/components/tables.css (.table-state).
 */
(function (global) {
  'use strict';

  function spinnerHtml(label, size) {
    return `
      <div class="page-loader" role="status" aria-live="polite">
        <span class="spinner ${size === 'lg' ? 'spinner-lg' : ''}" aria-hidden="true"></span>
        <span>${escapeHtml(label || 'Loading…')}</span>
      </div>
    `;
  }

  function renderInto(el, label) {
    if (!el) return;
    el.innerHTML = spinnerHtml(label);
  }

  function tableLoading(tbody, colspan, label) {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr><td colspan="${colspan}">${spinnerHtml(label || 'Loading records…')}</td></tr>
    `;
  }

  function tableEmpty(tbody, colspan, message, actionHtml) {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr><td colspan="${colspan}">
        <div class="table-state">
          <svg class="table-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/></svg>
          <h3>${escapeHtml(message || 'No records found.')}</h3>
          ${actionHtml || ''}
        </div>
      </td></tr>
    `;
  }

  function tableError(tbody, colspan, message, onRetry) {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr><td colspan="${colspan}">
        <div class="table-state table-state--error">
          <svg class="table-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
          <h3>Something went wrong</h3>
          <p>${escapeHtml(message || 'This data could not be loaded.')}</p>
          <button type="button" class="btn btn-secondary btn-sm" data-retry>Retry</button>
        </div>
      </td></tr>
    `;
    if (onRetry) {
      const btn = tbody.querySelector('[data-retry]');
      if (btn) btn.addEventListener('click', onRetry);
    }
  }

  function setButtonLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalHtml = btn.dataset.originalHtml || btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${escapeHtml(loadingText || 'Please wait…')}</span>`;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  function fullScreen(show, label) {
    let el = document.getElementById('full-screen-loader');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'full-screen-loader';
        el.className = 'full-screen-loader';
        document.body.appendChild(el);
      }
      el.innerHTML = `<span class="spinner spinner-lg"></span><span class="text-muted">${escapeHtml(label || 'Loading…')}</span>`;
    } else if (el) {
      el.remove();
    }
  }

  global.Loader = {
    spinnerHtml,
    renderInto,
    tableLoading,
    tableEmpty,
    tableError,
    setButtonLoading,
    fullScreen,
  };
})(window);
