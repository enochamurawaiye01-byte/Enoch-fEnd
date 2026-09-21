(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    SimpleCrudPage.init({
      tbody: document.getElementById('parents-tbody'),
      paginationEl: document.getElementById('parents-pagination'),
      searchInput: document.getElementById('parents-search'),
      addBtn: document.getElementById('add-parent-btn'),
      moduleKey: 'parents',
      entityLabel: 'Parent',
      service: ParentsService,
      columns: [
        {
          key: 'name', label: 'Parent', render: (r) => `
          <div class="avatar-cell">
            <span class="avatar">${escapeHtml(initials(`${r.firstName || ''} ${r.lastName || ''}`))}</span>
            <div><div class="name">${escapeHtml(`${r.firstName || ''} ${r.lastName || ''}`)}</div><div class="sub">${escapeHtml(r.email || '—')}</div></div>
          </div>`,
        },
        { key: 'phone', label: 'Phone', render: (r) => escapeHtml(r.phone || '—') },
        { key: 'childrenCount', label: 'Children', render: (r) => escapeHtml(String(r.childrenCount ?? '—')) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(r.status || 'ACTIVE'))}</span>` },
      ],
      formFields: [
        { name: 'firstName', label: 'First Name', required: true },
        { name: 'lastName', label: 'Last Name', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone Number', help: 'Phone numbers are not required to be unique.' },
        { name: 'address', label: 'Address', type: 'textarea' },
      ],
      deleteMessage: (row) => `Delete parent "${row.firstName} ${row.lastName}"? Linked children records will be unaffected but lose this guardian link.`,
    });
  });
})();
