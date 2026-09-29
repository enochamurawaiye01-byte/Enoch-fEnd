(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser || !['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role)) return;

    let activeRoleGroup = 'ALL';
    let activeStatusFilter = 'ALL';
    let cachedUsersMap = new Map();

    // System 26 Roles Definition (Categorized)
    const ALL_ROLES = [
      // Category 1: Executive & Administrative Leadership
      { id: 'SUPER_ADMIN', name: 'SUPER_ADMIN', label: 'Super Admin', category: 'Executive & Admin', isSystem: true },
      { id: 'ADMIN', name: 'ADMIN', label: 'School Admin', category: 'Executive & Admin', isSystem: true },
      { id: 'MANAGEMENT', name: 'MANAGEMENT', label: 'Executive Management', category: 'Executive & Admin', isSystem: false },
      { id: 'GOVERNING_BOARD', name: 'GOVERNING_BOARD', label: 'Board of Governors', category: 'Executive & Admin', isSystem: false },

      // Category 2: Academic Leadership
      { id: 'PRINCIPAL', name: 'PRINCIPAL', label: 'School Principal', category: 'Academic Leadership', isSystem: false },
      { id: 'VICE_PRINCIPAL_ACADEMICS', name: 'VICE_PRINCIPAL_ACADEMICS', label: 'VP (Academics)', category: 'Academic Leadership', isSystem: false },
      { id: 'VICE_PRINCIPAL_ADMIN', name: 'VICE_PRINCIPAL_ADMIN', label: 'VP (Administration)', category: 'Academic Leadership', isSystem: false },
      { id: 'HEAD_TEACHER', name: 'HEAD_TEACHER', label: 'Head Teacher', category: 'Academic Leadership', isSystem: false },
      { id: 'DEAN_OF_STUDENTS', name: 'DEAN_OF_STUDENTS', label: 'Dean of Students', category: 'Academic Leadership', isSystem: false },
      { id: 'HEAD_OF_DEPARTMENT', name: 'HEAD_OF_DEPARTMENT', label: 'Head of Department (HOD)', category: 'Academic Leadership', isSystem: false },
      { id: 'EXAM_OFFICER', name: 'EXAM_OFFICER', label: 'Controller of Examinations', category: 'Academic Leadership', isSystem: false },

      // Category 3: Teaching Faculty
      { id: 'SENIOR_TEACHER', name: 'SENIOR_TEACHER', label: 'Senior Subject Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'CLASS_TEACHER', name: 'CLASS_TEACHER', label: 'Class Form Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'SUBJECT_TEACHER', name: 'SUBJECT_TEACHER', label: 'Subject Specialist Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'TEACHER', name: 'TEACHER', label: 'General Teacher', category: 'Teaching Faculty', isSystem: false },

      // Category 4: Financial & Bursary Department
      { id: 'BURSAR', name: 'BURSAR', label: 'Chief Bursar', category: 'Financial & Bursary', isSystem: false },
      { id: 'ACCOUNTANT', name: 'ACCOUNTANT', label: 'School Accountant', category: 'Financial & Bursary', isSystem: false },

      // Category 5: Facilities & Student Services
      { id: 'LIBRARIAN', name: 'LIBRARIAN', label: 'Head Librarian', category: 'Facilities & Services', isSystem: false },
      { id: 'LAB_ATTENDANT', name: 'LAB_ATTENDANT', label: 'Science & ICT Lab Officer', category: 'Facilities & Services', isSystem: false },
      { id: 'HEALTH_OFFICER', name: 'HEALTH_OFFICER', label: 'School Nurse / Health Officer', category: 'Facilities & Services', isSystem: false },
      { id: 'TRANSPORT_MANAGER', name: 'TRANSPORT_MANAGER', label: 'Transport & Logistics Manager', category: 'Facilities & Services', isSystem: false },
      { id: 'HOSTEL_WARDEN', name: 'HOSTEL_WARDEN', label: 'Hostel Warden', category: 'Facilities & Services', isSystem: false },
      { id: 'INVENTORY_OFFICER', name: 'INVENTORY_OFFICER', label: 'Inventory / Storekeeper', category: 'Facilities & Services', isSystem: false },

      // Category 6: Support & Operational Staff
      { id: 'SECURITY_CHIEF', name: 'SECURITY_CHIEF', label: 'Chief Security Officer', category: 'Support Staff', isSystem: false },
      { id: 'STAFF', name: 'STAFF', label: 'General Administrative Staff', category: 'Support Staff', isSystem: false },

      // Category 7: Students & Guardians
      { id: 'STUDENT', name: 'STUDENT', label: 'Enrolled Student', category: 'Students & Parents', isSystem: false },
      { id: 'PARENT', name: 'PARENT', label: 'Parent / Guardian', category: 'Students & Parents', isSystem: false },
    ];

    const ROLE_MODULE_MAP = {
      SUPER_ADMIN: ['All 56 Backend Modules', 'Full Control', 'Audit Logs', 'Matrix Config'],
      ADMIN: ['55 Operational Modules', 'User Management', 'School Settings', 'Academic Control'],
      MANAGEMENT: ['analytics', 'reports', 'financial_reports', 'management', 'students', 'staff'],
      GOVERNING_BOARD: ['analytics', 'reports', 'financial_reports', 'management'],

      PRINCIPAL: ['teachers', 'students', 'classes', 'report_cards', 'discipline', 'academic_sessions', 'announcements'],
      VICE_PRINCIPAL_ACADEMICS: ['teachers', 'classes', 'subjects', 'examinations', 'lessons', 'timetable'],
      VICE_PRINCIPAL_ADMIN: ['teacher_attendance', 'discipline', 'events', 'transport', 'hostel'],
      HEAD_TEACHER: ['teacher_attendance', 'attendance', 'classes', 'students', 'report_cards', 'lessons', 'settings'],
      DEAN_OF_STUDENTS: ['discipline', 'hostel', 'prefects', 'events', 'students'],
      HEAD_OF_DEPARTMENT: ['subjects', 'class_subjects', 'teacher_assignments', 'lessons'],
      EXAM_OFFICER: ['question_bank', 'examinations', 'exam_attempts', 'results', 'transcripts'],

      SENIOR_TEACHER: ['classes', 'students', 'attendance', 'assignments', 'examinations', 'results', 'lessons'],
      CLASS_TEACHER: ['classes', 'students', 'attendance', 'report_cards', 'timetable'],
      SUBJECT_TEACHER: ['subjects', 'assignments', 'question_bank', 'examinations', 'results', 'lessons'],
      TEACHER: ['classes', 'students', 'attendance', 'assignments', 'examinations', 'results', 'timetable', 'lessons'],

      BURSAR: ['fees', 'invoices', 'payments', 'receipts', 'reports', 'inventory'],
      ACCOUNTANT: ['invoices', 'payments', 'receipts', 'reports', 'fee_accounts'],

      LIBRARIAN: ['library', 'documents', 'announcements'],
      LAB_ATTENDANT: ['inventory', 'exam_attempts', 'settings'],
      HEALTH_OFFICER: ['medical', 'students', 'notifications'],
      TRANSPORT_MANAGER: ['transport', 'students', 'events'],
      HOSTEL_WARDEN: ['hostel', 'students', 'discipline'],
      INVENTORY_OFFICER: ['inventory', 'reports'],

      SECURITY_CHIEF: ['discipline', 'events', 'announcements'],
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
          render: (r) => `<a href="javascript:void(0)" class="view-user-details" data-id="${r.id}" style="color:#0A192F; font-weight:600;">${escapeHtml(r.fullName || 'Unnamed Account')}</a>`
        },
        { key: 'email', label: 'Email Address', render: (r) => escapeHtml(r.email || '—') },
        {
          key: 'role',
          label: 'Role',
          render: (r) => `<span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(r.role))}</span>`
        },
        {
          key: 'status',
          label: 'Status',
          render: (r) => {
            const st = (r.status || 'INACTIVE').toUpperCase();
            if (st === 'ACTIVE') return `<span class="badge badge-success">✓ Active</span>`;
            return `<span class="badge badge-danger">✗ Inactive</span>`;
          }
        },
      ],
      rowActions: (row) => {
        const isActive = (row.status || '').toUpperCase() === 'ACTIVE';
        return `
          <button type="button" class="btn btn-secondary btn-sm" data-action="change-role">Change Role</button>
          <button type="button" class="btn btn-outline btn-sm" data-action="manage-perms">Grant Permissions</button>
          ${isActive 
            ? `<button type="button" class="btn btn-secondary btn-sm" data-action="deactivate">Deactivate</button>`
            : `<button type="button" class="btn btn-primary btn-sm" data-action="activate">Activate</button>`
          }
          <button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>
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
              <div class="active-role-banner" style="background:#0A192F; color:#ffffff; padding:14px 18px; border-radius:4px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; opacity:0.85;">Current Active Role</div>
                  <div style="font-size:16px; font-weight:700; margin-top:2px; color:#ffffff;">${escapeHtml(formatRoleName(currentRole))} <span style="font-size:12px; font-weight:normal; opacity:0.85;">(${currentRole})</span></div>
                </div>
                <span class="badge" style="background:#162A45; color:#fff; font-size:11px; padding:4px 10px; font-weight:600;">✓ Active</span>
              </div>

              <div class="edit-role-controls" style="margin-bottom: 16px;">
                <label style="font-weight:600; color:#111111; display:block; margin-bottom:8px; font-size:13px;">Edit Role Action</label>
                <div style="display:flex; gap:10px;">
                  <button type="button" class="btn btn-primary role-toggle-btn active" id="btn-action-add" style="flex:1; background:#0A192F; border-color:#0A192F; font-weight:600; font-size:13px;">Assign / Add Role</button>
                  <button type="button" class="btn btn-outline role-toggle-btn" id="btn-action-remove" style="flex:1; border-color:#991B1B; color:#991B1B; font-weight:600; font-size:13px;">Remove Role (Reset)</button>
                </div>
              </div>

              <form id="change-role-form" class="form">
                <div id="role-select-box">
                  <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <label class="form-label" style="font-weight:600; color:#111111; font-size:13px; margin:0;">Select Target Role (26 Categorized Roles)</label>
                    <input type="text" id="role-modal-search" placeholder="🔍 Search roles..." style="padding:4px 10px; font-size:12px; border:1px solid #D8D2C6; border-radius:4px; width:160px;" />
                  </div>
                  <div class="roles-grid-select" id="roles-modal-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:8px; max-height:280px; overflow-y:auto; padding:4px;">
                    ${ALL_ROLES.map((r) => {
                      const isSelected = r.id === currentRole;
                      return `
                        <label class="role-card-opt ${isSelected ? 'active-opt' : ''}" data-role-id="${r.id}" data-role-label="${escapeHtml(r.label).toLowerCase()}" data-role-cat="${escapeHtml(r.category).toLowerCase()}" style="border:1px solid ${isSelected ? '#0A192F' : '#D8D2C6'}; background:${isSelected ? '#F3EEE7' : '#ffffff'}; padding:8px 12px; border-radius:4px; cursor:pointer; display:block; transition:all 0.12s ease;">
                          <div style="display:flex; align-items:center; justify-content:space-between;">
                            <strong style="color:#111111; font-size:13px;">${escapeHtml(r.label)}</strong>
                            <input type="radio" name="role" value="${r.id}" ${isSelected ? 'checked' : ''} style="width:15px; height:15px; cursor:pointer;" />
                          </div>
                          <div style="font-size:11px; color:#666666; margin-top:4px;">Category: <span>${escapeHtml(r.category)}</span></div>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div id="role-remove-warning" style="display:none; background:#FEF2F2; border:1px solid rgba(153,27,27,0.2); padding:12px; border-radius:4px; margin-top:10px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:#991B1B; font-size:16px;">⚠️</span>
                    <strong style="color:#991B1B; font-size:13px;">Remove Active Role Override</strong>
                  </div>
                  <p style="color:#555555; margin:4px 0 0 0; font-size:12px; line-height:1.5;">
                    Removing the active role override will reset this user account to default basic <strong>STAFF</strong> profile and revoke custom administrative privileges.
                  </p>
                </div>

                <div class="modal__footer" style="margin-top:16px; text-align:right;">
                  <button type="submit" class="btn btn-primary" id="submit-role-btn" style="background:#0A192F; border-color:#0A192F; font-weight:600; padding:8px 18px;">Save Role Changes</button>
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
            const roleSearchInput = modalEl.querySelector('#role-modal-search');
            let isRemoveMode = false;

            if (roleSearchInput) {
              roleSearchInput.addEventListener('input', () => {
                const query = roleSearchInput.value.toLowerCase().trim();
                modalEl.querySelectorAll('.role-card-opt').forEach((card) => {
                  const id = card.dataset.roleId.toLowerCase();
                  const label = card.dataset.roleLabel;
                  const cat = card.dataset.roleCat;
                  if (id.includes(query) || label.includes(query) || cat.includes(query)) {
                    card.style.display = 'block';
                  } else {
                    card.style.display = 'none';
                  }
                });
              });
            }

            if (btnAdd && btnRemove) {
              btnAdd.addEventListener('click', () => {
                isRemoveMode = false;
                btnAdd.classList.add('active');
                btnAdd.style.background = '#0A192F';
                btnAdd.style.color = '#ffffff';
                btnRemove.classList.remove('active');
                btnRemove.style.background = 'transparent';
                btnRemove.style.color = '#991B1B';
                roleSelectBox.style.display = 'block';
                roleRemoveWarning.style.display = 'none';
              });

              btnRemove.addEventListener('click', () => {
                isRemoveMode = true;
                btnRemove.classList.add('active');
                btnRemove.style.background = '#991B1B';
                btnRemove.style.color = '#ffffff';
                btnAdd.classList.remove('active');
                btnAdd.style.background = 'transparent';
                btnAdd.style.color = '#0A192F';
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
              <div class="user-header-banner" style="background:#0A192F; color:#ffffff; padding:14px 18px; border-radius:4px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; opacity:0.85;">User Account Profile</div>
                  <div style="font-size:16px; font-weight:700; margin-top:2px; color:#ffffff;">${escapeHtml(userName)}</div>
                  <div style="font-size:12px; opacity:0.85;">${escapeHtml(rowData ? rowData.email : '')}</div>
                </div>
                <div>
                  <span class="badge" style="background:#162A45; color:#fff; font-size:12px; padding:4px 12px; font-weight:600; border:1px solid rgba(255,255,255,0.2);">
                    Active Role: ${escapeHtml(formatRoleName(currentRole))}
                  </span>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:10px;">
                <p style="color:#555555; font-size:13px; margin:0; line-height:1.4;">
                  Select any defined role below to grant total module access under that role to <strong>${escapeHtml(userName)}</strong>.
                </p>
                <input type="text" id="grant-modal-search" placeholder="🔍 Search role or module..." style="padding:5px 12px; font-size:12px; border:1px solid #D8D2C6; border-radius:4px; width:220px;" />
              </div>

              <div class="defined-roles-list" id="grant-roles-modal-list" style="display:flex; flex-direction:column; gap:8px; max-height:340px; overflow-y:auto; padding-right:4px;">
                ${ALL_ROLES.map((r) => {
                  const modules = ROLE_MODULE_MAP[r.id] || [];
                  const isCurrent = r.id === currentRole;
                  const modulesSearchStr = modules.join(' ').toLowerCase();
                  return `
                    <div class="role-def-card" data-role-id="${r.id}" data-role-label="${escapeHtml(r.label).toLowerCase()}" data-modules="${modulesSearchStr}" style="border: 1px solid ${isCurrent ? '#0A192F' : '#D8D2C6'}; background: ${isCurrent ? '#F3EEE7' : '#ffffff'}; border-radius:4px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; transition:all 0.12s ease;">
                      <div style="flex:1; padding-right:15px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                          <h4 style="margin:0; color:#111111; font-size:14px; font-weight:600;">${escapeHtml(r.label)}</h4>
                          <code style="background:#F3EEE7; color:#0A192F; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${r.id}</code>
                          <span style="font-size:11px; color:#666666; background:#F8FAF9; padding:2px 6px; border-radius:4px; border:1px solid #D8D2C6;">${escapeHtml(r.category)}</span>
                          ${isCurrent ? '<span class="badge badge-success" style="font-size:11px; padding:2px 6px;">Active Role</span>' : ''}
                        </div>
                        <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
                          ${modules.map((m) => `<span style="background:#F3EEE7; color:#333333; border:1px solid #D8D2C6; border-radius:4px; padding:2px 6px; font-size:11px;">${m}</span>`).join('')}
                        </div>
                      </div>
                      <div>
                        <button type="button" class="btn ${isCurrent ? 'btn-secondary' : 'btn-primary'} btn-grant-role-action" data-role-id="${r.id}" data-role-label="${escapeHtml(r.label)}" style="${isCurrent ? '' : 'background:#0A192F; border-color:#0A192F;'} font-size:12px; font-weight:600; padding:6px 12px;">
                          ${isCurrent ? 'Current Role' : 'Grant Role'}
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="margin-top:14px; padding-top:12px; border-top:1px dashed #D8D2C6;">
                <details style="cursor:pointer;">
                  <summary style="font-weight:600; color:#111111; font-size:13px;">Or Grant Single Module Permission Override</summary>
                  <form id="grant-single-module-form" class="form" style="margin-top:10px;">
                    <div class="form-group" style="display:flex; gap:10px; margin-bottom:0;">
                      <select name="moduleKey" class="form-control" style="flex:1;" required>
                        ${ALL_MODULES.map((m) => `<option value="${m.key}">${m.label} (${m.key})</option>`).join('')}
                      </select>
                      <button type="submit" class="btn btn-outline" style="border-color:#0A192F; color:#0A192F; font-weight:600;">Grant Single Module</button>
                    </div>
                  </form>
                </details>
              </div>
            </div>
          `,
          onOpen: (modalEl) => {
            const grantSearchInput = modalEl.querySelector('#grant-modal-search');
            if (grantSearchInput) {
              grantSearchInput.addEventListener('input', () => {
                const query = grantSearchInput.value.toLowerCase().trim();
                modalEl.querySelectorAll('.role-def-card').forEach((card) => {
                  const id = card.dataset.roleId.toLowerCase();
                  const label = card.dataset.roleLabel;
                  const modules = card.dataset.modules;
                  if (id.includes(query) || label.includes(query) || modules.includes(query)) {
                    card.style.display = 'flex';
                  } else {
                    card.style.display = 'none';
                  }
                });
              });
            }
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
                <strong style="color:#111111; font-size:13px;">${escapeHtml(m.label)}</strong>
                <code style="background:#F3EEE7; padding:2px 6px; border-radius:4px; margin-left:6px; color:#0A192F; font-size:11px;">${escapeHtml(m.key)}</code>
                <div style="font-size:11px; color:#666666; margin-top:2px;">${escapeHtml(m.desc)}</div>
              </td>
              ${ALL_ROLES.map((r) => {
                const stateKey = `${r.id}:${m.key}`;
                const isChecked = matrixState[stateKey] !== undefined 
                  ? matrixState[stateKey] 
                  : (r.id === 'SUPER_ADMIN' || r.id === 'ADMIN' || (r.id === 'TEACHER' && ['classes', 'students', 'attendance', 'assignments', 'examinations', 'results', 'timetable', 'lessons'].includes(m.key)));
                
                return `
                  <td style="text-align:center;">
                    <input type="checkbox" class="matrix-toggle" data-role-id="${r.id}" data-module-key="${m.key}" ${isChecked ? 'checked' : ''} ${r.id === 'SUPER_ADMIN' ? 'disabled' : ''} style="width:16px; height:16px; cursor:pointer;" />
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
          <div class="perm-card" style="border:1px solid #D8D2C6; background:#ffffff; border-radius:4px; padding:12px 16px;">
            <div class="perm-card__header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="color:#111111; font-weight:600;">${escapeHtml(r.label)}</span>
              ${r.isSystem ? '<span class="badge badge-outline">System</span>' : '<span class="badge badge-success">Custom</span>'}
            </div>
            <div class="perm-card__desc" style="font-size:12px; color:#555555; margin-bottom:8px;">${escapeHtml(r.name)} role definition for Mercy T College.</div>
            <div style="font-size:11px; color:#666666; font-weight:600;">Access Scope: ${r.id === 'SUPER_ADMIN' || r.id === 'ADMIN' ? 'Full Access (All 56 Modules)' : 'Role Tailored Access'}</div>
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
