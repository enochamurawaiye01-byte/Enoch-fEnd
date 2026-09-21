(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const childSelect = document.getElementById('child-select');
    const payBtn = document.getElementById('make-payment-btn');
    let currentChildId = null;
    let childrenList = [];

    const table = DataTable.create({
      tbody: document.getElementById('payments-tbody'),
      paginationEl: document.getElementById('payments-pagination'),
      columns: [
        { key: 'amount', label: 'Amount', render: (r) => `<span class="numeric">${formatCurrency(r.amount)}</span>` },
        { key: 'method', label: 'Method', render: (r) => escapeHtml(titleCaseFromEnum(r.method || r.paymentMethod || '')) },
        { key: 'reference', label: 'Reference', render: (r) => escapeHtml(r.reference || '—') },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date || r.createdAt) },
      ],
      fetchPage: (page) => (currentChildId ? PaymentsService.byStudent(currentChildId, { page, pageSize: 20 }) : Promise.resolve({ items: [], meta: null })),
      emptyMessage: 'No payments recorded yet.',
    });

    function openPaymentModal() {
      if (!currentChildId) { Toast.warning('Select a child first.'); return; }
      Modal.open({
        title: 'Make a Payment',
        bodyHtml: `
          <form id="payment-form" novalidate>
            <div class="form-group">
              <label class="form-label">Amount (₦) <span class="required">*</span></label>
              <input type="number" name="amount" min="0" step="0.01" required />
              <span class="form-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label">Method</label>
              <select name="method">
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Reference / Transaction ID</label>
              <input type="text" name="reference" />
            </div>
            <input type="hidden" name="studentId" value="${escapeHtml(currentChildId)}" />
          </form>
        `,
        footerHtml: `<button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                     <button type="submit" form="payment-form" class="btn btn-primary" id="payment-save-btn">Submit Payment</button>`,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          modalEl.querySelector('#payment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.target).entries());
            const { valid, errors } = Validators.validateForm(values, { amount: [(v) => Validators.required(v, 'Amount'), (v) => Validators.numeric(v, 'Amount')] });
            if (!valid) {
              const group = modalEl.querySelector('[name="amount"]').closest('.form-group');
              group.classList.add('has-error');
              group.querySelector('.form-error').textContent = errors.amount;
              return;
            }
            const btn = document.getElementById('payment-save-btn');
            Loader.setButtonLoading(btn, true, 'Submitting…');
            try {
              await PaymentsService.create(values);
              Toast.success('Payment submitted successfully.');
              Modal.close();
              table.load();
            } catch (err) {
              Toast.error(err.message || 'Unable to submit this payment.');
            } finally {
              Loader.setButtonLoading(btn, false);
            }
          });
        },
      });
    }

    const children = await ChildSelector.populate(childSelect);
    childrenList = children;
    if (children.length) currentChildId = childSelect.value;
    table.load();
    childSelect.addEventListener('change', () => { currentChildId = childSelect.value; table.load(); });
    payBtn.addEventListener('click', openPaymentModal);
  });
})();
