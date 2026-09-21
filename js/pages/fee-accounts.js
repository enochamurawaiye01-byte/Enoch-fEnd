(function () {
  'use strict';

  function renderAccount(container, student, account) {
    const charges = account.charges || account.items || [];
    const balance = account.balance ?? account.outstandingBalance ?? 0;
    const totalCharged = account.totalCharged ?? account.totalBilled ?? 0;
    const totalPaid = account.totalPaid ?? 0;

    container.innerHTML = `
      <div class="account-head">
        <div>
          <h2>${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`)}</h2>
          <p class="text-muted">Reg. No: ${escapeHtml(student.regNumber || '—')} &middot; Class: ${escapeHtml(student.className || student.class?.name || '—')}</p>
        </div>
      </div>

      <div class="stat-grid" style="margin-top:var(--space-4);">
        <div class="stat-card">
          <div class="stat-card__label">Total Charged</div>
          <div class="stat-card__value">${formatCurrency(totalCharged)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Paid</div>
          <div class="stat-card__value">${formatCurrency(totalPaid)}</div>
        </div>
        <div class="stat-card stat-card--accent">
          <div class="stat-card__label">Outstanding Balance</div>
          <div class="stat-card__value">${formatCurrency(balance)}</div>
        </div>
      </div>

      <h3 style="margin-top:var(--space-6);">Charges & Payments</h3>
      ${
        charges.length
          ? `<table class="data-table">
              <thead><tr><th>Description</th><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
              <tbody>
                ${charges
                  .map(
                    (c) => `
                  <tr>
                    <td>${escapeHtml(c.description || c.name || '—')}</td>
                    <td>${formatDate(c.date || c.createdAt)}</td>
                    <td><span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(c.type || (c.amount < 0 ? 'PAYMENT' : 'CHARGE')))}</span></td>
                    <td class="numeric">${formatCurrency(c.amount)}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
          : '<div class="table-state"><p>No charge or payment history yet.</p></div>'
      }
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    const searchInput = document.getElementById('account-student-search');
    const resultsList = document.getElementById('account-search-results');
    const viewer = document.getElementById('account-viewer');

    const search = debounce(async () => {
      const q = searchInput.value.trim();
      if (!q) { resultsList.innerHTML = ''; resultsList.hidden = true; return; }
      resultsList.hidden = false;
      resultsList.innerHTML = Loader.spinnerHtml('Searching…');
      try {
        const { items } = await StudentsService.list({ search: q, pageSize: 10 });
        resultsList.innerHTML = items.length
          ? items.map((s) => `
            <button type="button" class="search-result-item" data-student-id="${escapeHtml(s.id)}">
              <strong>${escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`)}</strong>
              <span class="text-muted text-small">${escapeHtml(s.regNumber || '')} &middot; ${escapeHtml(s.className || s.class?.name || '')}</span>
            </button>`).join('')
          : '<div class="table-state"><p>No matching students.</p></div>';
      } catch (err) {
        resultsList.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
      }
    }, 350);
    searchInput.addEventListener('input', search);

    resultsList.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-student-id]');
      if (!btn) return;
      resultsList.hidden = true;
      searchInput.value = btn.textContent.trim();
      viewer.innerHTML = Loader.spinnerHtml('Loading account…');
      try {
        const student = await StudentsService.get(btn.dataset.studentId);
        const account = await FeeAccountsService.byStudent(btn.dataset.studentId);
        renderAccount(viewer, student, account || {});
      } catch (err) {
        viewer.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
      }
    });
  });
})();
