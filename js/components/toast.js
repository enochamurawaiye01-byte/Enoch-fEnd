/**
 * Toast notification system. Subtle, professional, auto-dismissing.
 * Matches css/components/alerts.css (.toast-stack, .toast, .toast__*).
 * Usage: Toast.show('success' | 'error' | 'warning' | 'info', message)
 */
(function (global) {
  'use strict';

  let stack = null;

  function ensureStack() {
    if (stack) return stack;
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'true');
    document.body.appendChild(stack);
    return stack;
  }

  const ICON_PATHS = {
    success: '<path d="M5 13l4 4L19 7"/>',
    error: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    warning: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  };
  const TITLES = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Notice' };
  const MODIFIER = { success: '', error: 'toast-error', warning: 'toast-warning', info: 'toast-info' };

  function show(type, message, opts = {}) {
    const root = ensureStack();
    const toast = document.createElement('div');
    toast.className = `toast ${MODIFIER[type] || ''}`.trim();
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    toast.innerHTML = `
      <svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[type] || ICON_PATHS.info}</svg>
      <div class="toast__body">
        <div class="toast__title">${escapeHtml(TITLES[type] || 'Notice')}</div>
        <div class="toast__msg">${escapeHtml(message)}</div>
      </div>
      <svg class="toast__close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="cursor:pointer"><path d="M18 6 6 18M6 6l12 12"/></svg>
    `;
    root.appendChild(toast);

    const duration = opts.duration || 4500;
    const timer = setTimeout(dismiss, duration);

    function dismiss() {
      clearTimeout(timer);
      toast.style.transition = 'opacity 160ms ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 180);
    }

    toast.querySelector('.toast__close').addEventListener('click', dismiss);
    return dismiss;
  }

  global.Toast = {
    show,
    success: (msg, opts) => show('success', msg, opts),
    error: (msg, opts) => show('error', msg, opts),
    warning: (msg, opts) => show('warning', msg, opts),
    info: (msg, opts) => show('info', msg, opts),
  };
})(window);
