/**
 * Centralized date/time formatting for the ERP.
 * Standard display format: 12 Sep 2026
 */
(function (global) {
  'use strict';

  function toDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDate(value, opts) {
    const d = toDate(value);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', Object.assign({ day: '2-digit', month: 'short', year: 'numeric' }, opts));
  }

  function formatDateTime(value) {
    const d = toDate(value);
    if (!d) return '—';
    return `${formatDate(d)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function formatTime(value) {
    const d = toDate(value);
    if (!d) return '—';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(value) {
    const d = toDate(value);
    if (!d) return '—';
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(d);
  }

  function toInputDate(value) {
    const d = toDate(value);
    if (!d) return '';
    return d.toISOString().slice(0, 10);
  }

  global.formatDate = formatDate;
  global.formatDateTime = formatDateTime;
  global.formatTime = formatTime;
  global.timeAgo = timeAgo;
  global.toInputDate = toInputDate;
})(window);
