(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('account-profile-content');
    if (!container) return;
    container.innerHTML = '<section class="card">Loading your profile…</section>';
    try {
      let user = await window.authGuardReady;
      if (!user) user = await AuthService.fetchCurrentUser();
      if (!user) throw new Error('Your account profile could not be loaded.');
      container.innerHTML = `
        <section class="card">
          <div class="card__head">
            <div class="avatar-cell">
              <span class="avatar" style="width:64px;height:64px;font-size:1.1rem;">${escapeHtml(initials(user.fullName || 'User'))}</span>
              <div>
                <h2 style="margin:0;">${escapeHtml(user.fullName || 'User')}</h2>
                <span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(user.role || ''))}</span>
              </div>
            </div>
          </div>
          <div class="profile-grid">
            <div><span class="form-label">Email</span><p>${escapeHtml(user.email || '—')}</p></div>
            <div><span class="form-label">Phone</span><p>${escapeHtml(user.phoneNumber || '—')}</p></div>
            <div><span class="form-label">Account status</span><p>${escapeHtml(titleCaseFromEnum(user.status || '')) || '—'}</p></div>
          </div>
        </section>
      `;
    } catch (error) {
      container.innerHTML = `<div class="table-state table-state--error">${escapeHtml(error.message || 'Unable to load your profile.')}</div>`;
    }
  });
})();
