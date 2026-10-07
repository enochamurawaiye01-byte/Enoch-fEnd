(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    let table;
    let cachedRowsMap = new Map();
    const canManage = ['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role);
    const statusFilterEl = document.getElementById('applicants-status-filter');

    table = DataTable.create({
      tbody: document.getElementById('applicants-tbody'),
      paginationEl: document.getElementById('applicants-pagination'),
      pageSize: 25,
      columns: [
        {
          key: 'fullName',
          label: 'Applicant Name',
          render: (row) => `<a href="javascript:void(0)" class="view-user-details" data-id="${row.id}" style="color: var(--color-deep-navy); font-weight: bold; text-decoration: underline;">${escapeHtml(row.fullName || `${row.firstName || ''} ${row.lastName || ''}` || 'Unnamed Applicant')}</a>`
        },
        {
          key: 'role',
          label: 'Role / Class',
          render: (row) => `<span class="badge badge-outline" style="border-color:var(--color-deep-navy); color:var(--color-deep-navy);">${escapeHtml(titleCaseFromEnum(row.role || row.currentClass || row.desiredClass?.name || 'STUDENT'))}</span>`
        },
        { key: 'email', label: 'Email Address', render: (row) => escapeHtml(row.email || '-') },
        { key: 'phoneNumber', label: 'Phone Number', render: (row) => escapeHtml(row.phoneNumber || row.parentPhone || '-') },
        { key: 'createdAt', label: 'Applied Date', render: (row) => formatDateTime(row.createdAt) },
        {
          key: 'status',
          label: 'Status',
          render: (row) => {
            const st = (row.status || 'INACTIVE').toUpperCase();
            if (['ACTIVE', 'APPROVED', 'CONVERTED'].includes(st)) {
              return `<span class="badge badge-success" style="background:var(--color-deep-navy); color:#fff;">Approved</span>`;
            } else if (['REJECTED', 'DEACTIVATED', 'SUSPENDED'].includes(st)) {
              return `<span class="badge badge-danger" style="background:var(--color-brand-red); color:#fff;">Rejected</span>`;
            }
            return `<span class="badge badge-warning" style="background:#b9783c; color:#fff;">Pending Review</span>`;
          }
        },
      ],
      rowActions: (row) => {
        const st = (row.status || 'INACTIVE').toUpperCase();
        if (['ACTIVE', 'APPROVED', 'CONVERTED'].includes(st)) {
          const approvalUserId = row.source === 'admission' ? row.convertedStudent?.userId : row.id;
          const isStudentOrTeacher = row.source === 'admission'
            ? Boolean(row.convertedStudent?.userId)
            : row.role === 'STUDENT' || row.role === 'TEACHER';
          const canResendEmail = row.email && isStudentOrTeacher && approvalUserId;
          const resendButton = canResendEmail
            ? `<button type="button" class="btn btn-secondary btn-sm" data-action="resend-email" data-user-id="${escapeHtml(approvalUserId)}">Resend approval email</button>`
            : '';
          return `<span class="text-success font-weight-bold" style="color:var(--color-deep-navy); font-weight:bold;"><i class="fas fa-check-circle"></i> Approved</span>${resendButton}`;
        } else if (['REJECTED', 'DEACTIVATED', 'SUSPENDED'].includes(st)) {
          return `<span class="text-danger font-weight-bold" style="color:var(--color-brand-red); font-weight:bold;"><i class="fas fa-times-circle"></i> Rejected</span>`;
        }

        if (!canManage) return '';
        return `
          <button type="button" class="btn btn-primary btn-sm" data-action="approve" data-source="${row.source || 'user'}" style="background-color:var(--color-deep-navy); border-color:var(--color-deep-navy);">Approve</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="reject" data-source="${row.source || 'user'}" style="background-color:var(--color-brand-red); border-color:var(--color-brand-red);">Reject</button>
        `;
      },
      fetchPage: async (page, filters) => {
        try {
          const selectedStatus = statusFilterEl ? statusFilterEl.value : 'PENDING';
          const [usersRes, admissionsRes] = await Promise.all([
            UsersService.list({ page: 1, pageSize: 100, search: filters.search || '' }).catch(() => ({ items: [] })),
            window.AdmissionsService ? AdmissionsService.list({ search: filters.search || '' }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
          ]);

          const userItems = (usersRes.items || []).map((u) => ({
            ...u,
            source: 'user',
            status: u.status === 'INACTIVE' ? 'PENDING' : u.status
          }));

          const admissionItems = (Array.isArray(admissionsRes) ? admissionsRes : admissionsRes.items || []).map((a) => ({
            ...a,
            fullName: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            role: 'ADMISSION_APP',
            source: 'admission',
            status: a.status === 'APPLIED' || a.status === 'UNDER_REVIEW' ? 'PENDING' : a.status
          }));

          let combined = [...userItems, ...admissionItems];
          cachedRowsMap.clear();
          combined.forEach((item) => cachedRowsMap.set(String(item.id), item));

          if (selectedStatus && selectedStatus !== 'ALL') {
            combined = combined.filter((item) => {
              const st = (item.status || 'PENDING').toUpperCase();
              if (selectedStatus === 'PENDING') return ['PENDING', 'INACTIVE', 'APPLIED', 'UNDER_REVIEW'].includes(st);
              if (selectedStatus === 'APPROVED') return ['APPROVED', 'ACTIVE', 'CONVERTED'].includes(st);
              if (selectedStatus === 'REJECTED') return ['REJECTED', 'DEACTIVATED', 'SUSPENDED'].includes(st);
              return true;
            });
          }

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
      emptyMessage: 'No applications found matching the selected filter criteria.',
    });

    table.load();

    const search = document.getElementById('applicants-search');
    if (search) {
      search.addEventListener('input', debounce(() => table.setFilters({ search: search.value.trim() }), 350));
    }

    if (statusFilterEl) {
      statusFilterEl.addEventListener('change', () => table.reload());
    }

    const tbody = document.getElementById('applicants-tbody');

    // Click handler for opening Full User Profile Modal
    tbody.addEventListener('click', async (event) => {
      const nameLink = event.target.closest('.view-user-details');
      if (nameLink) {
        event.preventDefault();
        const rowId = nameLink.dataset.id;
        const rowData = cachedRowsMap.get(rowId);
        if (rowData && window.UserDetailsModal) {
          window.UserDetailsModal.open(rowData);
        }
        return;
      }

      // Action button handler
      const button = event.target.closest('[data-action]');
      const row = event.target.closest('tr[data-row-id]');
      if (!button || !row) return;

      const rowId = row.dataset.rowId;
      const action = button.dataset.action;
      const source = button.dataset.source;
      const isApprove = action === 'approve';
      const rowData = cachedRowsMap.get(rowId);
      const targetName = rowData ? (rowData.fullName || `${rowData.firstName || ''} ${rowData.lastName || ''}`) : 'applicant';

      if (action === 'resend-email') {
        try {
          const result = await UsersService.resendApprovalEmail(button.dataset.userId || rowId);
          if (result?.email === true) {
            Toast.success(`Klaviyo accepted the approval event for ${rowData?.email}; the Application Approved flow will process the email.`);
          } else {
            const reason = result?.errors?.join(' ') || 'Klaviyo did not accept the approval event.';
            Toast.error(`The account is approved, but Klaviyo did not accept the event: ${reason}`);
          }
        } catch (error) {
          Toast.error(error.message || 'Unable to resend the approval email.');
        }
        return;
      }

      ConfirmDialog.open({
        title: isApprove ? `Approve ${targetName}` : `Reject ${targetName}`,
        message: isApprove
          ? `Approving will activate ${targetName}'s account, generate their official registration number, and trigger the Klaviyo Application Approved flow for their email.`
          : `Rejecting will deny access to ${targetName} and send a polite notice of rejection to their email.`,
        confirmLabel: isApprove ? 'Confirm Approval' : 'Confirm Rejection',
        tone: isApprove ? 'primary' : 'danger',
        onConfirm: async () => {
          try {
            if (source === 'admission') {
              if (isApprove) {
                const approved = await AdmissionsService.update(rowId, { status: 'APPROVED' });
                const registrationNumber = approved.convertedStudent?.registrationNumber;
                if (approved.communication?.email === true) {
                  Toast.success(`Admission approved! ${registrationNumber ? `Official Reg No: ${registrationNumber}. ` : ''}Klaviyo accepted the approval event for flow processing.`);
                } else {
                  const reason = approved.communication?.errors?.join(' ') || 'Klaviyo did not accept the approval event.';
                  Toast.error(`Admission approved, but Klaviyo did not accept the event: ${reason}`);
                }
              } else {
                await AdmissionsService.update(rowId, { status: 'REJECTED' });
                Toast.success(`Admission application rejected. Rejection email dispatched.`);
              }
            } else {
              if (isApprove) {
                const result = await UsersService.activate(rowId);
                const regNo = result.communication?.registrationNumber || result.registrationNumber || '';
                if (result.communication?.email === true) {
                  Toast.success(`Application approved! ${regNo ? `Registration Number: ${regNo}. ` : ''}Klaviyo accepted the approval event for flow processing.`);
                } else {
                  const reason = result.communication?.errors?.join(' ') || 'Klaviyo did not accept the approval event.';
                  Toast.error(`Application approved, but Klaviyo did not accept the event: ${reason}`);
                }
              } else {
                await UsersService.reject(rowId);
                Toast.success(`Application rejected. Rejection email dispatched.`);
              }
            }
            table.reload();
          } catch (error) {
            Toast.error(error.message || 'Unable to update application status.');
          }
        },
      });
    });
  });
})();
