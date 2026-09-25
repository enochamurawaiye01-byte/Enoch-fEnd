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
        { key: 'fullName', label: 'Applicant', render: (row) => `<strong>${escapeHtml(row.fullName || `${row.firstName || ''} ${row.lastName || ''}` || 'Unnamed applicant')}</strong>` },
        { key: 'role', label: 'Type / Role', render: (row) => `<span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(row.role || row.desiredClass?.name || 'ADMISSION'))}</span>` },
        { key: 'email', label: 'Email', render: (row) => escapeHtml(row.email || '-') },
        { key: 'phoneNumber', label: 'Phone', render: (row) => escapeHtml(row.phoneNumber || '-') },
        { key: 'createdAt', label: 'Applied Date', render: (row) => formatDateTime(row.createdAt) },
        { key: 'status', label: 'Status', render: (row) => `<span class="badge badge-warning">${escapeHtml(titleCaseFromEnum(row.status || 'INACTIVE'))}</span>` },
      ],
      rowActions: (row) => canManage ? `<button type="button" class="btn btn-primary btn-sm" data-action="approve" data-source="${row.source || 'user'}">Approve</button> <button type="button" class="btn btn-danger btn-sm" data-action="reject" data-source="${row.source || 'user'}">Reject</button>` : '',
      fetchPage: async (page, filters) => {
        try {
          const [usersRes, admissionsRes] = await Promise.all([
            UsersService.list({ page, pageSize: 20, status: 'INACTIVE', search: filters.search || '' }),
            window.AdmissionsService ? AdmissionsService.list({ status: 'APPLIED' }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
          ]);

          const userItems = (usersRes.items || []).map((u) => ({ ...u, source: 'user' }));
          const admissionItems = (Array.isArray(admissionsRes) ? admissionsRes : admissionsRes.items || []).map((a) => ({
            ...a,
            fullName: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            role: 'ADMISSION_APP',
            source: 'admission',
          }));

          const combined = [...userItems, ...admissionItems];
          return {
            items: combined,
            total: combined.length,
            page: 1,
            pageSize: 50,
          };
        } catch (err) {
          return { items: [], total: 0 };
        }
      },
      emptyMessage: 'There are currently no pending applications for review.',
    });

    table.load();
    const search = document.getElementById('applicants-search');
    if (search) {
      search.addEventListener('input', debounce(() => table.setFilters({ search: search.value.trim() }), 350));
    }

    document.getElementById('applicants-tbody').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      const row = event.target.closest('tr[data-row-id]');
      if (!button || !row) return;
      const action = button.dataset.action;
      const source = button.dataset.source;
      const isApprove = action === 'approve';

      ConfirmDialog.open({
        title: isApprove ? 'Approve Application' : 'Reject Application',
        message: isApprove
          ? 'Approving this application provisions an active account and generates the official registration number.'
          : 'Rejecting this application will deny access to the applicant.',
        confirmLabel: isApprove ? 'Approve Application' : 'Reject Application',
        tone: isApprove ? 'primary' : 'danger',
        onConfirm: async () => {
          try {
            if (source === 'admission') {
              if (isApprove) {
                await AdmissionsService.update(row.dataset.rowId, { status: 'APPROVED' });
                const converted = await AdmissionsService.convertToStudent(row.dataset.rowId);
                Toast.success(`Admission approved! Student created with Reg No: ${converted.registrationNumber || 'N/A'}`);
              } else {
                await AdmissionsService.update(row.dataset.rowId, { status: 'REJECTED' });
                Toast.success('Admission application rejected.');
              }
            } else {
              if (isApprove) {
                const result = await UsersService.activate(row.dataset.rowId);
                const regNo = result.communication?.registrationNumber || result.registrationNumber || '';
                Toast.success(`Application approved! ${regNo ? `Registration Number: ${regNo}` : 'Account activated.'}`);
              } else {
                await UsersService.reject(row.dataset.rowId);
                Toast.success('Application rejected.');
              }
            }
            table.reload();
          } catch (error) {
            Toast.error(error.message || 'Unable to process this application action.');
          }
        },
      });
    });
  });
})();
