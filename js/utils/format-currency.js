/**
 * Centralized Naira currency formatting.
 */
(function (global) {
  'use strict';

  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatCurrency(amount) {
    const value = Number(amount);
    if (Number.isNaN(value)) return '₦0.00';
    return formatter.format(value).replace('NGN', '₦').replace(/^\s*₦\s*/, '₦');
  }

  function formatCurrencyCompact(amount) {
    const value = Number(amount) || 0;
    if (Math.abs(value) >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
    return formatCurrency(value);
  }

  global.formatCurrency = formatCurrency;
  global.formatCurrencyCompact = formatCurrencyCompact;
})(window);
