(function () {
  'use strict';

  function printReceipt(receipt) {
    const bodyHtml = `
      <div class="invoice-sheet">
        <div class="invoice-head">
          <div>
            <h2>Enoch International College</h2>
            <p class="text-muted">Official Receipt #${escapeHtml(receipt.receiptNumber || receipt.id)}</p>
          </div>
          <div class="text-right"><p><strong>Date:</strong> ${formatDate(receipt.createdAt || receipt.date)}</p></div>
        </div>
        <p><strong>Received from:</strong> ${escapeHtml(receipt.studentName || `${receipt.student?.firstName || ''} ${receipt.student?.lastName || ''}`.trim() || '—')}</p>
        <table class="data-table" style="margin-top:var(--space-4);">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody><tr><td>${escapeHtml(receipt.description || 'Fee Payment')}</td><td class="numeric">${formatCurrency(receipt.amount)}</td></tr></tbody>
          <tfoot><tr><td><strong>Total Received</strong></td><td class="numeric"><strong>${formatCurrency(receipt.amount)}</strong></td></tr></tfoot>
        </table>
      </div>
    `;
    Modal.open({
      title: 'Receipt',
      size: 'lg',
      bodyHtml,
      footerHtml: `<button type="button" class="btn btn-secondary" data-action="close">Close</button>
                   <button type="button" class="btn btn-primary" id="do-print-receipt">Print</button>`,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="close"]').addEventListener('click', Modal.close);
        modalEl.querySelector('#do-print-receipt').addEventListener('click', () => window.print());
      },
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    const table = DataTable.create({
      tbody: document.getElementById('receipts-tbody'),
      paginationEl: document.getElementById('receipts-pagination'),
      columns: [
        { key: 'receiptNumber', label: 'Receipt #', render: (r) => escapeHtml(r.receiptNumber || r.id) },
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'amount', label: 'Amount', render: (r) => `<span class="numeric">${formatCurrency(r.amount)}</span>` },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt || r.date) },
      ],
      rowActions: () => `
        <div class="row" style="justify-content:flex-end;">
          <button type="button" class="icon-link" data-action="print" title="Print">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
        </div>`,
      fetchPage: (page) => ReceiptsService.list({ page, pageSize: 20 }),
      emptyMessage: 'No receipts found.',
    });
    table.load();

    document.getElementById('receipts-tbody').addEventListener('click', async (e) => {
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl || !e.target.closest('[data-action="print"]')) return;
      try {
        const receipt = await ReceiptsService.get(rowEl.dataset.rowId);
        printReceipt(receipt);
      } catch (err) {
        Toast.error(err.message || 'Unable to load this receipt.');
      }
    });
  });
})();
