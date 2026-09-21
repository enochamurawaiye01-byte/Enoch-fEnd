/**
 * Reusable modal component, matching css/components/modal.css
 * (.modal-overlay.open, .modal, .modal--sm/--lg/--xl, .modal__head/__body/__footer).
 *
 * Usage:
 *   Modal.open({ title, description, bodyHtml, footerHtml, size: 'md', onMount });
 *   Modal.close();
 */
(function (global) {
  'use strict';

  let overlay = null;
  let lastFocused = null;

  function ensureDom() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal__head">
          <div>
            <h2 id="modal-title"></h2>
            <p id="modal-desc" class="hidden"></p>
          </div>
          <button type="button" class="modal__close" aria-label="Close dialog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal__body"></div>
        <div class="modal__footer"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('.modal__close').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    return overlay;
  }

  function open({ title, description, bodyHtml, footerHtml, size = 'md', extraClass, onMount }) {
    const root = ensureDom();
    const modal = root.querySelector('.modal');
    modal.classList.remove('modal--sm', 'modal--lg', 'modal--xl');
    if (size !== 'md') modal.classList.add(`modal--${size}`);
    if (extraClass) modal.classList.add(extraClass);

    root.querySelector('#modal-title').textContent = title || '';
    const descEl = root.querySelector('#modal-desc');
    if (description) {
      descEl.textContent = description;
      descEl.classList.remove('hidden');
    } else {
      descEl.classList.add('hidden');
    }
    root.querySelector('.modal__body').innerHTML = bodyHtml || '';
    root.querySelector('.modal__footer').innerHTML = footerHtml || '';

    lastFocused = document.activeElement;
    root.classList.add('open');
    document.body.classList.add('no-scroll');

    if (typeof onMount === 'function') onMount(modal);

    const focusable = modal.querySelector('input, select, textarea, button');
    if (focusable) focusable.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.querySelector('.modal').classList.remove('confirm-dialog', 'confirm-dialog--warn');
    document.body.classList.remove('no-scroll');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  global.Modal = { open, close };
})(window);
