(function () {
  'use strict';

  function printInvoice(invoice) {
    const bodyHtml = `
      <div id="invoice-print-area" class="invoice-sheet">
        <div class="invoice-head">
          <div>
            <h2>Enoch International College</h2>
            <p class="text-muted">Invoice #${escapeHtml(invoice.invoiceNumber || invoice.id)}</p>
          </div>
          <div class="text-right">
            <p><strong>Date:</strong> ${formatDate(invoice.createdAt || invoice.date)}</p>
            <p><strong>Due:</strong> ${formatDate(invoice.dueDate)}</p>
          </div>
        </div>
        <p><strong>Billed to:</strong> ${escapeHtml(invoice.studentName || `${invoice.student?.firstName || ''} ${invoice.student?.lastName || ''}`.trim() || '—')}</p>
        <table class="data-table" style="margin-top:var(--space-4);">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>${escapeHtml(invoice.description || invoice.feeName || 'Fee Invoice')}</td><td class="numeric">${formatCurrency(invoice.amount)}</td></tr>
          </tbody>
          <tfoot><tr><td><strong>Total</strong></td><td class="numeric"><strong>${formatCurrency(invoice.amount)}</strong></td></tr></tfoot>
        </table>
        <p style="margin-top:var(--space-4);"><strong>Status:</strong> <span class="badge ${statusBadgeClass(invoice.status)}">${escapeHtml(titleCaseFromEnum(invoice.status))}</span></p>
      </div>
    `;
    Modal.open({
      title: 'Invoice',
      size: 'lg',
      bodyHtml,
      footerHtml: `<button type="button" class="btn btn-secondary" data-action="close">Close</button>
                   <button type="button" class="btn btn-primary" id="do-print-invoice">Print</button>`,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="close"]').addEventListener('click', Modal.close);
        modalEl.querySelector('#do-print-invoice').addEventListener('click', () => window.print());
      },
    });
  }

  function rowActions(row, canManage) {
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        <button type="button" class="icon-link" data-action="print" title="Print">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        </button>
        ${canManage ? `
        <button type="button" class="icon-link" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button type="button" class="icon-link" data-action="delete" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
        </button>` : ''}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'finance');

    let studentOptions = [], feeOptions = [];
    try {
      const [{ items: students }, { items: fees }] = await Promise.all([
        StudentsService.list({ pageSize: 200 }),
        FeesService.list({ pageSize: 100 }),
      ]);
      studentOptions = students.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
      feeOptions = fees.map((f) => ({ value: f.id, label: `${f.name} — ${formatCurrency(f.amount)}` }));
    } catch (e) { /* non-fatal */ }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('invoices-tbody'),
      paginationEl: document.getElementById('invoices-pagination'),
      searchInput: document.getElementById('invoices-search'),
      addBtn: document.getElementById('add-invoice-btn'),
      moduleKey: 'finance',
      entityLabel: 'Invoice',
      service: InvoicesService,
      columns: [
        { key: 'invoiceNumber', label: 'Invoice #', render: (r) => escapeHtml(r.invoiceNumber || r.id) },
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'amount', label: 'Amount', render: (r) => `<span class="numeric">${formatCurrency(r.amount)}</span>` },
        { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'feeId', label: 'Fee Item', type: 'select', required: true, options: feeOptions },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
      ],
      deleteMessage: (row) => `Delete invoice #${row.invoiceNumber || row.id}?`,
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="print"]')) {
          try {
            const invoice = await InvoicesService.get(id);
            printInvoice(invoice);
          } catch (err) {
            Toast.error(err.message || 'Unable to load this invoice.');
          }
        }
      },
    });
  });
})();
