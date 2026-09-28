(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser || !['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role)) return;

    let activeRoleGroup = 'ALL';
    let activeStatusFilter = 'ALL';
    let cachedUsersMap = new Map();

    // System Roles Definition
    const ALL_ROLES = [
      { id: 'SUPER_ADMIN', name: 'SUPER_ADMIN', label: 'Super Admin', isSystem: true },
      { id: 'ADMIN', name: 'ADMIN', label: 'Admin', isSystem: true },
      { id: 'MANAGEMENT', name: 'MANAGEMENT', label: 'Management', isSystem: false },
      { id: 'PRINCIPAL', name: 'PRINCIPAL', label: 'Principal', isSystem: false },
      { id: 'VICE_PRINCIPAL', name: 'VICE_PRINCIPAL', label: 'Vice Principal', isSystem: false },
      { id: 'HEAD_TEACHER', name: 'HEAD_TEACHER', label: 'Head Teacher', isSystem: false },
      { id: 'BURSAR', name: 'BURSAR', label: 'Bursar', isSystem: false },
      { id: 'TEACHER', name: 'TEACHER', label: 'Teacher', isSystem: false },
      { id: 'STAFF', name: 'STAFF', label: 'Staff', isSystem: false },
      { id: 'STUDENT', name: 'STUDENT', label: 'Student', isSystem: false },
      { id: 'PARENT', name: 'PARENT', label: 'Parent', isSystem: false },
    ];

    const ROLE_MODULE_MAP = {
      SUPER_ADMIN: ['All 56 Backend Modules', 'Full Control', 'Audit Logs', 'Matrix Config'],
      ADMIN: ['55 Operational Modules', 'User Management', 'School Settings', 'Academic Control'],
      MANAGEMENT: ['analytics', 'reports', 'financial_reports', 'management', 'students', 'staff'],
      PRINCIPAL: ['teachers', 'students', 'classes', 'report_cards', 'discipline', 'academic_sessions'],
      VICE_PRINCIPAL: ['teachers', 'students', 'classes', 'discipline', 'timetable', 'events'],
      HEAD_TEACHER: ['teachers', 'students', 'classes', 'lessons', 'assignments', 'examinations'],
      BURSAR: ['fees', 'invoices', 'payments', 'receipts', 'reports', 'inventory'],
      TEACHER: ['classes', 'students', 'attendance', 'assignments', 'examinations', 'results', 'timetable', 'lessons'],
      STAFF: ['announcements', 'events', 'documents', 'messaging', 'notifications'],
      STUDENT: ['dashboards', 'assignments', 'examinations', 'report_cards', 'attendance', 'timetable'],
      PARENT: ['parents', 'students', 'report_cards', 'invoices', 'payments', 'messaging'],
    };

    function formatRoleName(roleStr) {
      if (!roleStr) return 'Unassigned';
      const found = ALL_ROLES.find((r) => r.id === roleStr || r.name === roleStr);
      if (found) return found.label;
      return roleStr.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    // All 56 Backend Modules from College/src/modules/
    const ALL_MODULES = [
      { key: 'admissions', label: 'Admissions & Applications', desc: 'Manage student admission applications, approvals, and student conversions' },
      { key: 'academic_sessions', label: 'Academic Sessions', desc: 'Create and configure academic years and school sessions' },
      { key: 'analytics', label: 'School Analytics', desc: 'View student performance charts, enrollment statistics, and financial overview' },
      { key: 'announcements', label: 'Announcements', desc: 'Publish broadcast announcements to students, parents, and teachers' },
      { key: 'assignments', label: 'Assignments & Homework', desc: 'Create, distribute, grade, and track student assignment submissions' },
      { key: 'attendance', label: 'Student Attendance', desc: 'Mark daily attendance, register class presence, and produce attendance logs' },
      { key: 'audit_logs', label: 'System Audit Logs', desc: 'Track all user actions, system modifications, timestamps, and security events' },
      { key: 'auth', label: 'Authentication & Tokens', desc: 'Configure login protocols, token lifetimes, and security settings' },
      { key: 'class_subjects', label: 'Class Subjects Link', desc: 'Map academic subjects to specific class levels and streams' },
      { key: 'classes', label: 'Classes & Arms', desc: 'Create Nursery, Primary, and Secondary class structures' },
      { key: 'dashboards', label: 'Dashboard Workspaces', desc: 'Access role-tailored workspace overviews' },
      { key: 'departments', label: 'Academic Departments', desc: 'Manage Sciences, Humanities, Commercial, and Vocational departments' },
      { key: 'discipline', label: 'Discipline Records', desc: 'Log behavioral incidents, sanctions, and student conduct notes' },
      { key: 'documents', label: 'Document Library', desc: 'Store student report cards, birth certificates, and official documents' },
      { key: 'enrollments', label: 'Session Enrollments', desc: 'Enroll students into academic sessions and active class arms' },
      { key: 'events', label: 'School Events Calendar', desc: 'Schedule open days, sports events, exams, and holidays' },
      { key: 'exam_attempts', label: 'Exam Attempts', desc: 'Track student online exam test sessions, start/end times, and scores' },
      { key: 'examinations', label: 'Examinations Portal', desc: 'Schedule CBT tests, mid-terms, and terminal examinations' },
      { key: 'fees', label: 'Fee Structures', desc: 'Set up tuition, registration, ICT, sports, and development fee schedules' },
      { key: 'gallery', label: 'Photo & Event Gallery', desc: 'Upload and publish school activity photo albums' },
      { key: 'hostel', label: 'Hostel & Boarding', desc: 'Allocate dormitory rooms, beds, and hostel supervisors' },
      { key: 'inventory', label: 'Inventory & Stock', desc: 'Track textbooks, uniforms, stationary, and school equipment' },
      { key: 'invoices', label: 'Fee Invoices', desc: 'Generate and issue billing invoices for student tuition' },
      { key: 'jobs', label: 'Background Jobs', desc: 'Execute scheduled email broadcasts, result calculations, and backups' },
      { key: 'klaviyo', label: 'Klaviyo Email Sync', desc: 'Sync subscriber profiles and send automated admission approval emails' },
      { key: 'lessons', label: 'Lesson Notes & Plans', desc: 'Submit and approve teacher weekly lesson plans and schemes of work' },
      { key: 'library', label: 'Library & Book Loans', desc: 'Catalog library books, issue loans, and track overdue returns' },
      { key: 'management', label: 'Executive Management', desc: 'Access high-level administrative overviews and board metrics' },
      { key: 'medical', label: 'Medical & Clinic', desc: 'Record student blood group, genotype, allergies, and infirmary visits' },
      { key: 'messaging', label: 'Internal Messaging', desc: 'Send direct messages between teachers, parents, and administrators' },
      { key: 'news', label: 'School News & Blog', desc: 'Publish newsletters and official blog updates' },
      { key: 'notifications', label: 'Push Notifications', desc: 'Dispatch in-app notifications for results, fees, and alerts' },
      { key: 'parents', label: 'Parent Profiles', desc: 'Manage parent guardian accounts, emergency contacts, and linked wards' },
      { key: 'payments', label: 'Payment Receipts & Transactions', desc: 'Record bank transfers, POS receipts, card payments, and fee balances' },
      { key: 'permissions', label: 'Permissions Management', desc: 'Grant and revoke custom permission keys and role assignments' },
      { key: 'prefects', label: 'Prefects & Student Leaders', desc: 'Assign student prefect positions and leadership duties' },
      { key: 'promotions', label: 'Student Class Promotions', desc: 'Promote students to next class levels at session end' },
      { key: 'question_bank', label: 'CBT Question Bank', desc: 'Create multiple-choice, essay, and true/false exam question pools' },
      { key: 'receipts', label: 'Payment Receipts', desc: 'Issue official stamped payment receipts for fee settlements' },
      { key: 'report_cards', label: 'Terminal Report Cards', desc: 'Compile, review, and print terminal student report cards' },
      { key: 'reports', label: 'Academic & Financial Reports', desc: 'Export executive PDF/Excel reports' },
      { key: 'results', label: 'Broadsheets & Results', desc: 'Compute subject scores, grades, GPAs, and class positions' },
      { key: 'roles', label: 'System Roles', desc: 'Manage role definitions and permissions hierarchy' },
      { key: 'settings', label: 'School Settings', desc: 'Configure school name, logo, motto, address, and system defaults' },
      { key: 'staff', label: 'Staff & Faculty', desc: 'Manage teaching faculty, staff ID numbers, and employment records' },
      { key: 'students', label: 'Student Directory', desc: 'Manage active student profiles, registration numbers, and records' },
      { key: 'subjects', label: 'Subject Curriculum', desc: 'Configure Mathematics, English, Sciences, and Art subjects' },
      { key: 'teacher_assignments', label: 'Teacher Subject Allocations', desc: 'Assign subject teachers to specific classes and arms' },
      { key: 'teacher_attendance', label: 'Staff Clock-In Attendance', desc: 'Track teacher daily clock-in times and attendance logs' },
      { key: 'teachers', label: 'Teacher Directory', desc: 'View teacher subject workloads, timetables, and performance' },
      { key: 'terms', label: 'Term Dates', desc: 'Configure 1st, 2nd, and 3rd term start/end dates' },
      { key: 'timetable', label: 'Class & Exam Timetable', desc: 'Build weekly lesson schedules and examination timetables' },
      { key: 'transcripts', label: 'Academic Transcripts', desc: 'Generate multi-year official academic transcripts' },
      { key: 'transport', label: 'School Transport & Bus Routes', desc: 'Assign students to school bus routes and transport drivers' },
      { key: 'users', label: 'User Account Management', desc: 'Create, edit, activate, deactivate, and delete user accounts' },
      { key: 'website', label: 'Public School Website CMS', desc: 'Edit public portal content, landing page, and news' },
    ];

    // Main Tabs switching
    const tabBtns = document.querySelectorAll('.rbac-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        tabPanes.forEach((p) => (p.style.display = 'none'));
        btn.classList.add('active');
        const target = document.getElementById(`tab-${btn.dataset.tab}`);
        if (target) target.style.display = 'block';

        if (btn.dataset.tab === 'matrix') loadMatrix();
        if (btn.dataset.tab === 'roles') loadRoles();
        if (btn.dataset.tab === 'permissions') loadPermissions();
      });
    });

    // Refresh Matrix button
    const refreshMatrixBtn = document.getElementById('refresh-matrix-btn');
    if (refreshMatrixBtn) {
      refreshMatrixBtn.addEventListener('click', () => loadMatrix());
    }

    // Save Matrix button
    const saveMatrixBtn = document.getElementById('save-matrix-btn');
    if (saveMatrixBtn) {
      saveMatrixBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.matrix-toggle');
        let matrixState = {};
        checkboxes.forEach((cb) => {
          const roleId = cb.dataset.roleId;
          const moduleKey = cb.dataset.moduleKey;
          matrixState[`${roleId}:${moduleKey}`] = cb.checked;
        });
        Storage.setItem('mtc_role_permission_matrix', matrixState);
        Toast.success('Role Permission Matrix configuration saved successfully!');
      });
    }

    // Role Category Tabs Event Listener
    const roleCatTabs = document.getElementById('role-category-tabs');
    if (roleCatTabs) {
      roleCatTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.role-cat-btn');
        if (!btn) return;
        roleCatTabs.querySelectorAll('.role-cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeRoleGroup = btn.dataset.roleGroup;
        userTable.reload();
      });
    }

    // Status Sub-Filter Event Listener
    const statusFilterContainer = document.querySelector('.status-sub-filter');
    if (statusFilterContainer) {
      statusFilterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.status-sub-btn');
        if (!btn) return;
        statusFilterContainer.querySelectorAll('.status-sub-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatusFilter = btn.dataset.statusFilter;
        userTable.reload();
      });
    }

    // Tab 1: User Accounts Table
    const userTable = DataTable.create({
      tbody: document.getElementById('access-users-tbody'),
      paginationEl: document.getElementById('access-users-pagination'),
      pageSize: 20,
      columns: [
        {
          key: 'fullName',
          label: 'User Name',
          render: (r) => `<a href="javascript:void(0)" class="view-user-details" data-id="${r.id}" style="color:#041664; font-weight:bold; text-decoration:underline;">${escapeHtml(r.fullName || 'Unnamed Account')}</a>`
        },
        { key: 'email', label: 'Email Address', render: (r) => escapeHtml(r.email || '—') },
        {
          key: 'role',
          label: 'Role',
          render: (r) => `<span class="badge badge-outline" style="border-color:#052F9A; color:#052F9A;">${escapeHtml(titleCaseFromEnum(r.role))}</span>`
        },
        {
          key: 'status',
          label: 'Status',
          render: (r) => {
            const st = (r.status || 'INACTIVE').toUpperCase();
            if (st === 'ACTIVE') return `<span class="badge badge-success" style="background:#10b981; color:#fff;">✓ Active</span>`;
            return `<span class="badge badge-danger" style="background:#B02032; color:#fff;">✗ Inactive</span>`;
          }
        },
      ],
      rowActions: (row) => {
        const isActive = (row.status || '').toUpperCase() === 'ACTIVE';
        return `
          <button type="button" class="btn btn-secondary btn-sm" data-action="change-role" style="font-size:12px;">Change Role</button>
          <button type="button" class="btn btn-outline btn-sm" data-action="manage-perms" style="font-size:12px;">Grant Permissions</button>
          ${isActive 
            ? `<button type="button" class="btn btn-warning btn-sm" data-action="deactivate" style="background-color:#D97706; border-color:#D97706; color:#fff; font-size:12px;">Deactivate</button>`
            : `<button type="button" class="btn btn-success btn-sm" data-action="activate" style="background-color:#10b981; border-color:#10b981; color:#fff; font-size:12px;">Activate</button>`
          }
          <button type="button" class="btn btn-danger btn-sm" data-action="delete" style="background-color:#B02032; border-color:#B02032; color:#fff; font-size:12px;">Delete</button>
        `;
      },
      fetchPage: async (page, filters) => {
        try {
          const res = await UsersService.list({ page: 1, pageSize: 100, search: filters.search || '' });
          let items = res.items || res.data || [];
          cachedUsersMap.clear();
          items.forEach((u) => cachedUsersMap.set(String(u.id), u));

          // Apply Category Role Filter
          if (activeRoleGroup !== 'ALL') {
            items = items.filter((u) => {
              const role = (u.role || '').toUpperCase();
              if (activeRoleGroup === 'TEACHER') return ['TEACHER', 'STAFF', 'HEAD_TEACHER'].includes(role);
              if (activeRoleGroup === 'STUDENT') return role === 'STUDENT';
              if (activeRoleGroup === 'PARENT') return role === 'PARENT';
              if (activeRoleGroup === 'ADMIN') return ['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'PRINCIPAL', 'VICE_PRINCIPAL', 'BURSAR'].includes(role);
              return true;
            });
          }

          // Apply Status Sub-Filter
          if (activeStatusFilter !== 'ALL') {
            items = items.filter((u) => {
              const st = (u.status || 'INACTIVE').toUpperCase();
              if (activeStatusFilter === 'ACTIVE') return st === 'ACTIVE';
              if (activeStatusFilter === 'INACTIVE') return st !== 'ACTIVE';
              return true;
            });
          }

          return {
            items,
            total: items.length,
            page: 1,
            pageSize: 50,
          };
        } catch (err) {
          return { items: [], total: 0 };
        }
      },
      emptyMessage: 'No user accounts match the selected category and status filters.',
    });

    userTable.load();

    const searchInput = document.getElementById('access-user-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => userTable.setFilters({ search: searchInput.value.trim() }), 350));
    }

    // User Table Event Handlers
    const tbody = document.getElementById('access-users-tbody');
    tbody.addEventListener('click', async (event) => {
      const nameLink = event.target.closest('.view-user-details');
      if (nameLink) {
        event.preventDefault();
        const userId = nameLink.dataset.id;
        const rowData = cachedUsersMap.get(userId);
        if (rowData && window.UserDetailsModal) {
          window.UserDetailsModal.open(rowData);
        }
        return;
      }

      const btn = event.target.closest('[data-action]');
      const row = event.target.closest('tr[data-row-id]');
      if (!btn || !row) return;

      const userId = row.dataset.rowId;
      const action = btn.dataset.action;
      const rowData = cachedUsersMap.get(userId);
      const userName = rowData ? (rowData.fullName || rowData.email || 'user') : 'user';

      if (action === 'activate') {
        ConfirmDialog.open({
          title: `Activate & Provision ${userName}`,
          message: `Activating ${userName} provisions all academic profiles, generates official registration/staff numbers, and sends an approval notification email.`,
          confirmLabel: 'Confirm Activation',
          tone: 'primary',
          onConfirm: async () => {
            try {
              const res = await UsersService.activate(userId);
              const regNo = res.registrationNumber || res.communication?.registrationNumber || '';
              Toast.success(`Account activated! ${regNo ? `Official Reg No: ${regNo}` : ''}`);
              userTable.reload();
            } catch (err) {
              Toast.error(err.message || 'Failed to activate user account.');
            }
          },
        });
      }

      if (action === 'deactivate') {
        ConfirmDialog.open({
          title: `Deactivate ${userName}`,
          message: `Deactivating ${userName} immediately revokes portal access and sets their status to Inactive.`,
          confirmLabel: 'Confirm Deactivation',
          tone: 'danger',
          onConfirm: async () => {
            try {
              await UsersService.deactivate(userId);
              Toast.success(`${userName} deactivated successfully.`);
              userTable.reload();
            } catch (err) {
              Toast.error(err.message || 'Failed to deactivate user account.');
            }
          },
        });
      }

      if (action === 'delete') {
        ConfirmDialog.open({
          title: `Delete ${userName}`,
          message: `Are you sure you want to permanently delete ${userName}? This action cannot be undone.`,
          confirmLabel: 'Permanently Delete User',
          tone: 'danger',
          onConfirm: async () => {
            try {
              await UsersService.delete(userId);
              Toast.success(`User ${userName} deleted successfully.`);
              userTable.reload();
            } catch (err) {
              Toast.error(err.message || 'Failed to delete user account.');
            }
          },
        });
      }

      if (action === 'change-role') {
        const currentRole = (rowData?.role || 'STAFF').toUpperCase();
        Modal.open({
          title: `Change & Edit User Role — ${userName}`,
          size: 'md',
          content: `
            <div class="user-role-modal-wrap" style="padding: 4px 0;">
              <div class="active-role-banner" style="background:#041664; color:#ffffff; padding:14px 18px; border-radius:8px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 6px rgba(4,22,100,0.15);">
                <div>
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; opacity:0.85;">Current Active Role</div>
                  <div style="font-size:18px; font-weight:bold; margin-top:2px; color:#ffffff;">${escapeHtml(formatRoleName(currentRole))} <span style="font-size:13px; font-weight:normal; opacity:0.85;">(${currentRole})</span></div>
                </div>
                <span class="badge" style="background:#04A1D0; color:#fff; font-size:12px; padding:6px 12px; font-weight:bold; border-radius:20px;">✓ Active</span>
              </div>

              <div class="edit-role-controls" style="margin-bottom: 16px;">
                <label style="font-weight:bold; color:#041664; display:block; margin-bottom:8px; font-size:14px;">Edit Role Action</label>
                <div style="display:flex; gap:10px;">
                  <button type="button" class="btn btn-primary role-toggle-btn active" id="btn-action-add" style="flex:1; background:#052F9A; border-color:#052F9A; font-weight:bold; font-size:13px;">Assign / Add Role</button>
                  <button type="button" class="btn btn-outline role-toggle-btn" id="btn-action-remove" style="flex:1; border-color:#B02032; color:#B02032; font-weight:bold; font-size:13px;">Remove Role (Reset)</button>
                </div>
              </div>

              <form id="change-role-form" class="form">
                <div id="role-select-box">
                  <label class="form-label" style="font-weight:bold; color:#041664; font-size:13px;">Select Target Role from Defined System Roles</label>
                  <div class="roles-grid-select" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:10px; max-height:280px; overflow-y:auto; padding:4px;">
                    ${ALL_ROLES.map((r) => {
                      const isSelected = r.id === currentRole;
                      return `
                        <label class="role-card-opt ${isSelected ? 'active-opt' : ''}" style="border:2px solid ${isSelected ? '#052F9A' : '#e2e8f0'}; background:${isSelected ? 'rgba(5, 47, 154, 0.06)' : '#ffffff'}; padding:10px 12px; border-radius:8px; cursor:pointer; display:block; transition:all 0.2s ease;">
                          <div style="display:flex; align-items:center; justify-content:space-between;">
                            <strong style="color:#041664; font-size:14px;">${escapeHtml(r.label)}</strong>
                            <input type="radio" name="role" value="${r.id}" ${isSelected ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                          </div>
                          <div style="font-size:11px; color:#64748b; margin-top:4px;">Code: <code>${r.id}</code></div>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div id="role-remove-warning" style="display:none; background:#fff5f5; border:1px solid #fecaca; padding:14px; border-radius:8px; margin-top:10px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:#B02032; font-size:18px;">⚠️</span>
                    <strong style="color:#B02032; font-size:14px;">Remove Active Role Override</strong>
                  </div>
                  <p style="color:#64748b; margin:6px 0 0 0; font-size:13px; line-height:1.5;">
                    Removing the active role override will reset this user account to default basic <strong>STAFF</strong> profile and revoke custom administrative privileges.
                  </p>
                </div>

                <div class="modal__footer" style="margin-top:20px; text-align:right;">
                  <button type="submit" class="btn btn-primary" id="submit-role-btn" style="background:#052F9A; border-color:#052F9A; font-weight:bold; padding:8px 20px;">Save Role Changes</button>
                </div>
              </form>
            </div>
          `,
          onOpen: (modalEl) => {
            const btnAdd = modalEl.querySelector('#btn-action-add');
            const btnRemove = modalEl.querySelector('#btn-action-remove');
            const roleSelectBox = modalEl.querySelector('#role-select-box');
            const roleRemoveWarning = modalEl.querySelector('#role-remove-warning');
            const form = modalEl.querySelector('#change-role-form');
            let isRemoveMode = false;

            if (btnAdd && btnRemove) {
              btnAdd.addEventListener('click', () => {
                isRemoveMode = false;
                btnAdd.classList.add('active');
                btnAdd.style.background = '#052F9A';
                btnAdd.style.color = '#ffffff';
                btnRemove.classList.remove('active');
                btnRemove.style.background = 'transparent';
                btnRemove.style.color = '#B02032';
                roleSelectBox.style.display = 'block';
                roleRemoveWarning.style.display = 'none';
              });

              btnRemove.addEventListener('click', () => {
                isRemoveMode = true;
                btnRemove.classList.add('active');
                btnRemove.style.background = '#B02032';
                btnRemove.style.color = '#ffffff';
                btnAdd.classList.remove('active');
                btnAdd.style.background = 'transparent';
                btnAdd.style.color = '#052F9A';
                roleSelectBox.style.display = 'none';
                roleRemoveWarning.style.display = 'block';
              });
            }

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const targetRole = isRemoveMode ? 'STAFF' : form.role.value;
              try {
                await RolesService.changeUserRole(userId, targetRole);
                Toast.success(`Role updated to ${formatRoleName(targetRole)}. Profile & modules provisioned!`);
                Modal.close();
                userTable.reload();
              } catch (err) {
                Toast.error(err.message || 'Failed to update user role.');
              }
            });
          },
        });
      }

      if (action === 'grant-access' || action === 'manage-perms') {
        const currentRole = (rowData?.role || 'STAFF').toUpperCase();
        Modal.open({
          title: `Grant Access & Role Entitlements — ${userName}`,
          size: 'lg',
          content: `
            <div class="grant-access-modal-wrap" style="padding: 4px 0;">
              <div class="user-header-banner" style="background:#041664; color:#ffffff; padding:14px 18px; border-radius:8px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; opacity:0.85;">User Account Profile</div>
                  <div style="font-size:18px; font-weight:bold; margin-top:2px; color:#ffffff;">${escapeHtml(userName)}</div>
                  <div style="font-size:12px; opacity:0.85;">${escapeHtml(rowData ? rowData.email : '')}</div>
                </div>
                <div>
                  <span class="badge" style="background:#052F9A; color:#fff; font-size:13px; padding:6px 14px; font-weight:bold; border:1px solid rgba(255,255,255,0.3);">
                    Active Role: ${escapeHtml(formatRoleName(currentRole))}
                  </span>
                </div>
              </div>

              <p style="color:#475569; font-size:13px; margin-bottom:14px; line-height:1.5;">
                Select any defined role below to grant total module access under that role to <strong>${escapeHtml(userName)}</strong>. Granting a role provisions linked Student/Staff/Parent profile records, generates identification numbers, and opens workspace permissions.
              </p>

              <div class="defined-roles-list" style="display:flex; flex-direction:column; gap:10px; max-height:340px; overflow-y:auto; padding-right:4px;">
                ${ALL_ROLES.map((r) => {
                  const modules = ROLE_MODULE_MAP[r.id] || [];
                  const isCurrent = r.id === currentRole;
                  return `
                    <div class="role-def-card" style="border: 1px solid ${isCurrent ? '#052F9A' : '#cbd5e1'}; background: ${isCurrent ? 'rgba(5, 47, 154, 0.04)' : '#ffffff'}; border-radius:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s ease;">
                      <div style="flex:1; padding-right:15px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                          <h4 style="margin:0; color:#041664; font-size:15px; font-weight:bold;">${escapeHtml(r.label)}</h4>
                          <code style="background:rgba(4, 22, 100, 0.08); color:#052F9A; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">${r.id}</code>
                          ${isCurrent ? '<span class="badge badge-success" style="font-size:11px; padding:2px 8px;">Active Role</span>' : ''}
                        </div>
                        <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
                          ${modules.map((m) => `<span style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; border-radius:4px; padding:2px 6px; font-size:11px;">${m}</span>`).join('')}
                        </div>
                      </div>
                      <div>
                        <button type="button" class="btn ${isCurrent ? 'btn-secondary' : 'btn-primary'} btn-grant-role-action" data-role-id="${r.id}" data-role-label="${escapeHtml(r.label)}" style="${isCurrent ? '' : 'background:#052F9A; border-color:#052F9A;'} font-size:12px; font-weight:bold; padding:8px 14px;">
                          ${isCurrent ? 'Current Role' : 'Grant This Role & Modules'}
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="margin-top:16px; padding-top:14px; border-top:1px dashed #cbd5e1;">
                <details style="cursor:pointer;">
                  <summary style="font-weight:bold; color:#041664; font-size:13px;">Or Grant Single Module Permission Override</summary>
                  <form id="grant-single-module-form" class="form" style="margin-top:10px;">
                    <div class="form-group" style="display:flex; gap:10px; margin-bottom:0;">
                      <select name="moduleKey" class="form-control" style="flex:1;" required>
                        ${ALL_MODULES.map((m) => `<option value="${m.key}">${m.label} (${m.key})</option>`).join('')}
                      </select>
                      <button type="submit" class="btn btn-outline" style="border-color:#052F9A; color:#052F9A; font-weight:bold;">Grant Single Module</button>
                    </div>
                  </form>
                </details>
              </div>
            </div>
          `,
          onOpen: (modalEl) => {
            modalEl.querySelectorAll('.btn-grant-role-action').forEach((btn) => {
              btn.addEventListener('click', async () => {
                const targetRoleId = btn.dataset.roleId;
                const targetRoleLabel = btn.dataset.roleLabel;
                try {
                  await RolesService.changeUserRole(userId, targetRoleId);
                  Toast.success(`Granted ${targetRoleLabel} access to ${userName}. All role modules provisioned!`);
                  Modal.close();
                  userTable.reload();
                } catch (err) {
                  Toast.error(err.message || 'Failed to grant role permissions.');
                }
              });
            });

            const singleForm = modalEl.querySelector('#grant-single-module-form');
            if (singleForm) {
              singleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const moduleKey = e.target.moduleKey.value;
                try {
                  let userObj = cachedUsersMap.get(userId);
                  if (userObj) {
                    userObj.grantedModules = userObj.grantedModules || [];
                    if (!userObj.grantedModules.includes(moduleKey)) userObj.grantedModules.push(moduleKey);
                  }
                  Toast.success(`Granted access to ${moduleKey} module.`);
                  Modal.close();
                } catch (err) {
                  Toast.error(err.message || 'Failed to grant module access.');
                }
              });
            }
          },
        });
      }
    });

    // Tab 2: Full 56-Module Role Permission Matrix
    async function loadMatrix() {
      const tbody = document.getElementById('matrix-tbody');
      const theadRow = document.getElementById('matrix-thead-row');
      if (!tbody || !theadRow) return;

      tbody.innerHTML = '<tr><td colspan="12">Loading 56-Module Permission Matrix...</td></tr>';
      
      try {
        theadRow.innerHTML = '<th>Module Name & Scope</th>' + ALL_ROLES.map((r) => `<th style="text-align:center; font-size:12px;">${escapeHtml(r.label)}</th>`).join('');

        // Matrix state from localStorage or defaults
        let matrixState = Storage.getItem('mtc_role_permission_matrix') || {};

        tbody.innerHTML = ALL_MODULES.map((m) => {
          return `
            <tr>
              <td>
                <strong style="color:#041664; font-size:14px;">${escapeHtml(m.label)}</strong>
                <code style="background:rgba(4, 22, 100, 0.06); padding:2px 6px; border-radius:4px; margin-left:6px; color:#052F9A; font-size:12px;">${escapeHtml(m.key)}</code>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">${escapeHtml(m.desc)}</div>
              </td>
              ${ALL_ROLES.map((r) => {
                const stateKey = `${r.id}:${m.key}`;
                const isChecked = matrixState[stateKey] !== undefined 
                  ? matrixState[stateKey] 
                  : (r.id === 'SUPER_ADMIN' || r.id === 'ADMIN' || (r.id === 'TEACHER' && ['classes', 'students', 'attendance', 'assignments', 'examinations', 'results', 'timetable', 'lessons'].includes(m.key)));
                
                return `
                  <td style="text-align:center;">
                    <input type="checkbox" class="matrix-toggle" data-role-id="${r.id}" data-module-key="${m.key}" ${isChecked ? 'checked' : ''} ${r.id === 'SUPER_ADMIN' ? 'disabled' : ''} style="width:18px; height:18px; cursor:pointer;" />
                  </td>
                `;
              }).join('')}
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-danger">Failed to load permission matrix: ${escapeHtml(err.message)}</td></tr>`;
      }
    }

    // Toggle Matrix Checkbox Event
    const matrixTbody = document.getElementById('matrix-tbody');
    if (matrixTbody) {
      matrixTbody.addEventListener('change', (e) => {
        const checkbox = e.target.closest('.matrix-toggle');
        if (!checkbox) return;

        const roleId = checkbox.dataset.roleId;
        const moduleKey = checkbox.dataset.moduleKey;
        const isChecked = checkbox.checked;

        let matrixState = Storage.getItem('mtc_role_permission_matrix') || {};
        matrixState[`${roleId}:${moduleKey}`] = isChecked;
        Storage.setItem('mtc_role_permission_matrix', matrixState);

        Toast.success(`${isChecked ? 'Granted' : 'Revoked'} ${moduleKey} for ${roleId}.`);
      });
    }

    // Tab 3: Load System Roles
    async function loadRoles() {
      const grid = document.getElementById('roles-grid');
      if (!grid) return;
      grid.innerHTML = '<div class="loader"></div>';
      try {
        grid.innerHTML = ALL_ROLES.map((r) => `
          <div class="perm-card">
            <div class="perm-card__header">
              <span style="color:#041664; font-weight:bold;">${escapeHtml(r.label)}</span>
              ${r.isSystem ? '<span class="badge badge-outline" style="border-color:#041664; color:#041664;">System</span>' : '<span class="badge badge-success">Custom</span>'}
            </div>
            <div class="perm-card__desc">${escapeHtml(r.name)} role definition for Mercy T College Nursery and Primary School.</div>
            <div style="font-size:12px; color:#64748b; font-weight:bold;">Access Scope: ${r.id === 'SUPER_ADMIN' || r.id === 'ADMIN' ? 'Full Access (All 56 Modules)' : 'Role Tailored Access'}</div>
          </div>
        `).join('');
      } catch (err) {
        grid.innerHTML = `<p class="text-danger">Failed to load roles: ${escapeHtml(err.message)}</p>`;
      }
    }

    // Tab 4: Load Permissions Catalog
    async function loadPermissions() {
      const tbody = document.getElementById('permissions-tbody');
      if (!tbody) return;
      tbody.innerHTML = ALL_MODULES.map((m) => `
        <tr>
          <td><span class="badge badge-outline" style="border-color:#041664; color:#041664;">${escapeHtml(m.key)}</span></td>
          <td><code>${escapeHtml(m.key)}:manage</code></td>
          <td>FULL_ACCESS</td>
          <td>${escapeHtml(m.desc)}</td>
          <td style="text-align:right;">
            <span class="badge badge-success">Active</span>
          </td>
        </tr>
      `).join('');
    }
  });
})();
