/**
 * Payments — recorded payments are immutable financial records
 * (create + view only, consistent with standard accounting practice).
 */
(function () {
  'use strict';

  let table;

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'finance');
    const addBtn = document.getElementById('record-payment-btn');
    if (addBtn) addBtn.hidden = !canManage;

    let studentOptions = [];
    try {
      const { items } = await StudentsService.list({ pageSize: 200 });
      studentOptions = items.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
    } catch (e) { /* non-fatal */ }

    table = DataTable.create({
      tbody: document.getElementById('payments-tbody'),
      paginationEl: document.getElementById('payments-pagination'),
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'amount', label: 'Amount', render: (r) => `<span class="numeric">${formatCurrency(r.amount)}</span>` },
        { key: 'method', label: 'Method', render: (r) => escapeHtml(titleCaseFromEnum(r.method || r.paymentMethod || '')) },
        { key: 'reference', label: 'Reference', render: (r) => escapeHtml(r.reference || '—') },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date || r.createdAt) },
      ],
      fetchPage: (page, filters) => PaymentsService.list({ page, pageSize: 20, ...filters }),
      emptyMessage: 'No payments recorded yet.',
      emptyActionHtml: canManage ? '<button type="button" class="btn btn-primary btn-sm" data-action="empty-add">Record Payment</button>' : '',
    });
    table.load();

    function openPaymentModal() {
      Modal.open({
        title: 'Record Payment',
        bodyHtml: `
          <form id="payment-form" novalidate>
            <div class="form-group">
              <label class="form-label">Student <span class="required">*</span></label>
              <select name="studentId" required>
                <option value="">Select student…</option>
                ${studentOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
              </select>
              <span class="form-error"></span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Amount (₦) <span class="required">*</span></label>
                <input type="number" name="amount" min="0" step="0.01" required />
                <span class="form-error"></span>
              </div>
              <div class="form-group">
                <label class="form-label">Method</label>
                <select name="method">
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Reference / Transaction ID</label>
              <input type="text" name="reference" />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" value="${toInputDate(new Date())}" />
            </div>
          </form>
        `,
        footerHtml: `
          <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button type="submit" form="payment-form" class="btn btn-primary" id="payment-save-btn">Record Payment</button>
        `,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          const form = modalEl.querySelector('#payment-form');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(form).entries());
            const { valid, errors } = Validators.validateForm(values, {
              studentId: [(v) => Validators.required(v, 'Student')],
              amount: [(v) => Validators.required(v, 'Amount'), (v) => Validators.numeric(v, 'Amount')],
            });
            form.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));
            if (!valid) {
              Object.entries(errors).forEach(([field, message]) => {
                const input = form.querySelector(`[name="${field}"]`);
                const group = input && input.closest('.form-group');
                if (group) { group.classList.add('has-error'); group.querySelector('.form-error').textContent = message; }
              });
              return;
            }
            const btn = document.getElementById('payment-save-btn');
            Loader.setButtonLoading(btn, true, 'Recording…');
            try {
              await PaymentsService.create(values);
              Toast.success('Payment recorded successfully.');
              Modal.close();
              table.reload();
            } catch (err) {
              Toast.error(err.message || 'Unable to record this payment.');
            } finally {
              Loader.setButtonLoading(btn, false);
            }
          });
        },
      });
    }

    if (addBtn) addBtn.addEventListener('click', openPaymentModal);
    document.getElementById('payments-tbody').addEventListener('click', (e) => {
      if (e.target.closest('[data-action="empty-add"]')) openPaymentModal();
    });
  });
})();
