(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const childSelect = document.getElementById('child-select');
    const container = document.getElementById('fees-viewer');

    async function loadAccount(childId) {
      if (!childId) { container.innerHTML = '<div class="table-state"><p>Select a child above.</p></div>'; return; }
      container.innerHTML = Loader.spinnerHtml('Loading fee account…');
      try {
        const account = await FeeAccountsService.byStudent(childId);
        const charges = account.charges || account.items || [];
        const balance = account.balance ?? account.outstandingBalance ?? 0;
        const totalCharged = account.totalCharged ?? account.totalBilled ?? 0;
        const totalPaid = account.totalPaid ?? 0;
        container.innerHTML = `
          <div class="stat-grid">
            <div class="stat-card"><div class="stat-card__label">Total Charged</div><div class="stat-card__value">${formatCurrency(totalCharged)}</div></div>
            <div class="stat-card"><div class="stat-card__label">Total Paid</div><div class="stat-card__value">${formatCurrency(totalPaid)}</div></div>
            <div class="stat-card stat-card--accent"><div class="stat-card__label">Outstanding Balance</div><div class="stat-card__value">${formatCurrency(balance)}</div></div>
          </div>
          <div class="card">
            <div class="card__head"><h3>Charges & Payments</h3></div>
            ${charges.length ? `<table class="data-table"><thead><tr><th>Description</th><th>Date</th><th>Type</th><th>Amount</th></tr></thead><tbody>${charges.map((c) => `<tr><td>${escapeHtml(c.description || c.name || '—')}</td><td>${formatDate(c.date || c.createdAt)}</td><td><span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(c.type || (c.amount < 0 ? 'PAYMENT' : 'CHARGE')))}</span></td><td class="numeric">${formatCurrency(c.amount)}</td></tr>`).join('')}</tbody></table>` : '<div class="table-state"><p>No charge or payment history yet.</p></div>'}
          </div>
        `;
      } catch (err) {
        container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
      }
    }

    const children = await ChildSelector.populate(childSelect);
    if (children.length) loadAccount(childSelect.value);
    childSelect.addEventListener('change', () => loadAccount(childSelect.value));
  });
})();
