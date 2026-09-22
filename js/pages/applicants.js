(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    let table;
    const canManage = ['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role);

    table = DataTable.create({
      tbody: document.getElementById('applicants-tbody'),
      paginationEl: document.getElementById('applicants-pagination'),
      pageSize: 20,
      columns: [
        { key: 'fullName', label: 'Applicant', render: (row) => escapeHtml(row.fullName || 'Unnamed applicant') },
        { key: 'role', label: 'Role', render: (row) => `<span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(row.role))}</span>` },
        { key: 'email', label: 'Email', render: (row) => escapeHtml(row.email || '-') },
        { key: 'phoneNumber', label: 'Phone', render: (row) => escapeHtml(row.phoneNumber || '-') },
        { key: 'createdAt', label: 'Applied', render: (row) => formatDateTime(row.createdAt) },
        { key: 'status', label: 'Status', render: (row) => '<span class="badge badge-warning">Pending approval</span>' },
      ],
      rowActions: (row) => canManage ? `<button type="button" class="btn btn-primary btn-sm" data-action="approve">Approve</button><button type="button" class="btn btn-danger btn-sm" data-action="reject">Reject</button>` : '',
      fetchPage: (page, filters) => UsersService.list({ page, pageSize: 20, status: 'INACTIVE', search: filters.search || '' }),
      emptyMessage: 'There are no pending applicants.',
    });

    table.load();
    const search = document.getElementById('applicants-search');
    search.addEventListener('input', debounce(() => table.setFilters({ search: search.value.trim() }), 350));

    document.getElementById('applicants-tbody').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      const row = event.target.closest('tr[data-row-id]');
      if (!button || !row) return;
      const action = button.dataset.action;
      const isApprove = action === 'approve';
      ConfirmDialog.open({
        title: isApprove ? 'Approve application' : 'Reject application',
        message: isApprove ? 'This activates the applicant account and sends the approval letter to the registered contact details.' : 'Reject this application? The account will remain unavailable.',
        confirmLabel: isApprove ? 'Approve' : 'Reject',
        tone: isApprove ? 'primary' : 'danger',
        onConfirm: async () => {
          try {
            if (isApprove) {
              const result = await UsersService.activate(row.dataset.rowId);
              const communication = result.communication || {};
              const sent = [communication.email ? 'email' : '', communication.sms ? 'SMS' : ''].filter(Boolean).join(' and ');
              const errors = communication.errors || [];
              Toast.success(sent ? `Approved. Formal message accepted by ${sent}${communication.registrationNumber ? `; reg no. ${communication.registrationNumber}` : ''}.` : `Approved, but no message provider accepted the delivery. ${errors.join(' ')}`);
            } else {
              await UsersService.reject(row.dataset.rowId);
              Toast.success('Application rejected.');
            }
            table.reload();
          } catch (error) {
            Toast.error(error.message || 'Unable to update this application.');
          }
        },
      });
    });
  });
})();
