/**
 * Financial Reports — revenue, outstanding fees and summary figures
 * sourced directly from the backend's /reports/financial endpoint.
 * Any metric the backend does not return is simply omitted.
 */
(function () {
  'use strict';

  function statCard(label, value, accent) {
    return `
      <div class="stat-card ${accent ? 'stat-card--accent' : ''}">
        <div class="stat-card__label">${escapeHtml(label)}</div>
        <div class="stat-card__value">${escapeHtml(String(value))}</div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const summaryGrid = document.getElementById('financial-summary-grid');
    const outstandingTbody = document.getElementById('outstanding-tbody');

    summaryGrid.innerHTML = Loader.spinnerHtml('Loading financial summary…');
    try {
      const summary = await FinancialReportsService.summary();
      const fields = [
        { key: 'totalRevenue', label: 'Total Revenue', currency: true },
        { key: 'outstandingFees', label: 'Total Outstanding', currency: true, accent: true },
        { key: 'paidInvoices', label: 'Paid Invoices' },
        { key: 'totalPayments', label: 'Payments Recorded' },
      ];
      const cards = fields
        .filter((f) => summary && summary[f.key] !== undefined && summary[f.key] !== null)
        .map((f) => statCard(f.label, f.currency ? formatCurrency(summary[f.key]) : f.percent ? `${Number(summary[f.key]).toFixed(1)}%` : summary[f.key], f.accent))
        .join('');
      summaryGrid.innerHTML = cards || '<div class="table-state"><p>No financial summary data is available yet.</p></div>';
    } catch (err) {
      summaryGrid.innerHTML = `<div class="table-state table-state--error" style="grid-column:1/-1;"><p>${escapeHtml(err.message)}</p></div>`;
    }

    Loader.tableLoading(outstandingTbody, 3, 'Loading outstanding fees…');
    try {
      const rows = await FinancialReportsService.outstanding();
      if (!rows.length) {
        Loader.tableEmpty(outstandingTbody, 3, 'No outstanding balances found.');
      } else {
        outstandingTbody.innerHTML = rows
          .map(
            (r) => `
          <tr>
            <td>${escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—')}</td>
            <td>${escapeHtml(r.className || r.class?.name || '—')}</td>
            <td class="numeric">${formatCurrency(r.balance || r.outstandingBalance)}</td>
          </tr>`
          )
          .join('');
      }
    } catch (err) {
      Loader.tableError(outstandingTbody, 3, err.message);
    }
  });
})();
