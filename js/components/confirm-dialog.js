/**
 * Confirmation dialog for destructive/important actions, built on Modal
 * and matching the .confirm-dialog / .confirm-dialog__icon rules in modal.css.
 * Usage:
 *   ConfirmDialog.open({
 *     title: 'Delete Student', message: 'This action cannot be undone.',
 *     confirmLabel: 'Delete', tone: 'danger', onConfirm: async () => { ... }
 *   });
 */
(function (global) {
  'use strict';

  const ICONS = {
    danger: '<path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/>',
    warn: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>',
  };

  function open({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', onConfirm }) {
    const isWarn = tone === 'warn';
    const bodyHtml = `
      <div class="confirm-dialog__icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${isWarn ? ICONS.warn : ICONS.danger}</svg>
      </div>
      <div>
        <p>${escapeHtml(message || 'Are you sure you want to proceed?')}</p>
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-action="cancel">${escapeHtml(cancelLabel)}</button>
      <button type="button" class="btn ${isWarn ? 'btn-accent' : 'btn-danger'}" data-action="confirm">${escapeHtml(confirmLabel)}</button>
    `;

    Modal.open({
      title,
      bodyHtml,
      footerHtml,
      size: 'sm',
      extraClass: `confirm-dialog${isWarn ? ' confirm-dialog--warn' : ''}`,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
        const confirmBtn = modalEl.querySelector('[data-action="confirm"]');
        confirmBtn.addEventListener('click', async () => {
          Loader.setButtonLoading(confirmBtn, true, 'Please wait…');
          try {
            await onConfirm();
            Modal.close();
          } catch (err) {
            Toast.error(err.message || 'The action could not be completed.');
            Loader.setButtonLoading(confirmBtn, false);
          }
        });
      },
    });
  }

  global.ConfirmDialog = { open };
})(window);
