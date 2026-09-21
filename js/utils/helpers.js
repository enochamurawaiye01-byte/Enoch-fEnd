/**
 * Generic helper utilities used across pages/services.
 */
(function (global) {
  'use strict';

  function debounce(fn, delay = 300) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initials(name) {
    if (!name) return '—';
    const parts = String(name).trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  }

  function getInitialParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /** Resolves the relative depth prefix ("../../") for pages under /pages/<role>/ */
  function rootPrefix() {
    return window.location.pathname.includes('/pages/') ? '../../' : './';
  }

  function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (['active', 'paid', 'published', 'approved', 'present', 'completed', 'success'].includes(s)) return 'badge-success';
    if (['pending', 'partial', 'draft', 'in-progress', 'in_progress'].includes(s)) return 'badge-warning';
    if (['inactive', 'overdue', 'rejected', 'absent', 'failed', 'closed'].includes(s)) return 'badge-danger';
    return 'badge-neutral';
  }

  function capitalize(str) {
    if (!str) return '';
    return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
  }

  function titleCaseFromEnum(value) {
    if (!value) return '—';
    return String(value)
      .split('_')
      .map((w) => capitalize(w))
      .join(' ');
  }

  global.debounce = debounce;
  global.qs = qs;
  global.qsa = qsa;
  global.escapeHtml = escapeHtml;
  global.initials = initials;
  global.getInitialParam = getInitialParam;
  global.rootPrefix = rootPrefix;
  global.statusBadgeClass = statusBadgeClass;
  global.capitalize = capitalize;
  global.titleCaseFromEnum = titleCaseFromEnum;
})(window);
