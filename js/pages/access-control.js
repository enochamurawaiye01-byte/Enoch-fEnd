(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.authGuardReady) await window.authGuardReady;
    if (!window.CurrentUser || !['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role)) return;

    let activeRoleGroup = 'ALL';
    let activeStatusFilter = 'ALL';
    let cachedUsersMap = new Map();
    let roleUsersCache = null;
    let roleUsersLoadPromise = null;
    let matrixRoles = [];
    let matrixPermissions = [];
    let pendingMatrixChanges = new Map();
    const EXCLUSIVE_ROLE_NAMES = new Set([
      'PRINCIPAL', 'VICE_PRINCIPAL', 'VICE_PRINCIPAL_ACADEMICS', 'VICE_PRINCIPAL_ADMIN',
      'HEAD_TEACHER', 'DEPUTY_HEAD_TEACHER', 'SCHOOL_ADMINISTRATOR', 'BURSAR', 'REGISTRAR'
    ]);

    // Complete System Roles Taxonomy (Categorized)
    let ALL_ROLES = [
      // Category 1: Executive & Administrative Leadership
      { id: 'SUPER_ADMIN', name: 'SUPER_ADMIN', label: 'Super Admin', category: 'Executive & Admin', isSystem: true },
      { id: 'ADMIN', name: 'ADMIN', label: 'School Admin', category: 'Executive & Admin', isSystem: true },
      { id: 'SCHOOL_ADMINISTRATOR', name: 'SCHOOL_ADMINISTRATOR', label: 'School Administrator', category: 'Executive & Admin', isSystem: false },
      { id: 'ADMIN_MANAGER', name: 'ADMIN_MANAGER', label: 'Admin Manager', category: 'Executive & Admin', isSystem: false },
      { id: 'HR_MANAGER', name: 'HR_MANAGER', label: 'HR Manager', category: 'Executive & Admin', isSystem: false },
      { id: 'MANAGEMENT', name: 'MANAGEMENT', label: 'Executive Management', category: 'Executive & Admin', isSystem: false },
      { id: 'GOVERNING_BOARD', name: 'GOVERNING_BOARD', label: 'Board of Governors', category: 'Executive & Admin', isSystem: false },

      // Category 2: Academic Leadership & Supervision
      { id: 'PRINCIPAL', name: 'PRINCIPAL', label: 'School Principal', category: 'Academic Leadership', isSystem: false },
      { id: 'VICE_PRINCIPAL', name: 'VICE_PRINCIPAL', label: 'Vice Principal', category: 'Academic Leadership', isSystem: false },
      { id: 'VICE_PRINCIPAL_ACADEMICS', name: 'VICE_PRINCIPAL_ACADEMICS', label: 'VP (Academics)', category: 'Academic Leadership', isSystem: false },
      { id: 'VICE_PRINCIPAL_ADMIN', name: 'VICE_PRINCIPAL_ADMIN', label: 'VP (Administration)', category: 'Academic Leadership', isSystem: false },
      { id: 'HEAD_TEACHER', name: 'HEAD_TEACHER', label: 'Head Teacher', category: 'Academic Leadership', isSystem: false },
      { id: 'DEPUTY_HEAD_TEACHER', name: 'DEPUTY_HEAD_TEACHER', label: 'Deputy Head Teacher', category: 'Academic Leadership', isSystem: false },
      { id: 'DEAN_OF_STUDENTS', name: 'DEAN_OF_STUDENTS', label: 'Dean of Students', category: 'Academic Leadership', isSystem: false },
      { id: 'ACADEMIC_COORDINATOR', name: 'ACADEMIC_COORDINATOR', label: 'Academic Coordinator', category: 'Academic Leadership', isSystem: false },
      { id: 'HEAD_OF_DEPARTMENT', name: 'HEAD_OF_DEPARTMENT', label: 'Head of Department (HOD)', category: 'Academic Leadership', isSystem: false },
      { id: 'SUBJECT_COORDINATOR', name: 'SUBJECT_COORDINATOR', label: 'Subject Coordinator', category: 'Academic Leadership', isSystem: false },
      { id: 'EXAMINATION_OFFICER', name: 'EXAMINATION_OFFICER', label: 'Examination Officer', category: 'Academic Leadership', isSystem: false },
      { id: 'EXAM_OFFICER', name: 'EXAM_OFFICER', label: 'Controller of Examinations', category: 'Academic Leadership', isSystem: false },
      { id: 'REGISTRAR', name: 'REGISTRAR', label: 'School Registrar', category: 'Academic Leadership', isSystem: false },
      { id: 'ADMISSIONS_OFFICER', name: 'ADMISSIONS_OFFICER', label: 'Admissions Officer', category: 'Academic Leadership', isSystem: false },

      // Category 3: Teaching Faculty
      { id: 'SENIOR_TEACHER', name: 'SENIOR_TEACHER', label: 'Senior Subject Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'CLASS_TEACHER', name: 'CLASS_TEACHER', label: 'Class Form Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'SUBJECT_TEACHER', name: 'SUBJECT_TEACHER', label: 'Subject Specialist Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'TEACHER', name: 'TEACHER', label: 'General Teacher', category: 'Teaching Faculty', isSystem: false },
      { id: 'SCHOOL_COUNSELOR', name: 'SCHOOL_COUNSELOR', label: 'School Counselor', category: 'Teaching Faculty', isSystem: false },

      // Category 4: Financial & Bursary Department
      { id: 'BURSAR', name: 'BURSAR', label: 'Chief Bursar', category: 'Financial & Bursary', isSystem: false },
      { id: 'ACCOUNTANT', name: 'ACCOUNTANT', label: 'School Accountant', category: 'Financial & Bursary', isSystem: false },
      { id: 'FINANCE_OFFICER', name: 'FINANCE_OFFICER', label: 'Finance Officer', category: 'Financial & Bursary', isSystem: false },
      { id: 'PROCUREMENT_OFFICER', name: 'PROCUREMENT_OFFICER', label: 'Procurement Officer', category: 'Financial & Bursary', isSystem: false },

      // Category 5: Operations & Facilities
      { id: 'STOREKEEPER', name: 'STOREKEEPER', label: 'Storekeeper', category: 'Operations & Services', isSystem: false },
      { id: 'INVENTORY_OFFICER', name: 'INVENTORY_OFFICER', label: 'Inventory Officer', category: 'Operations & Services', isSystem: false },
      { id: 'LIBRARIAN', name: 'LIBRARIAN', label: 'Head Librarian', category: 'Operations & Services', isSystem: false },
      { id: 'ICT_ADMINISTRATOR', name: 'ICT_ADMINISTRATOR', label: 'ICT Administrator', category: 'Operations & Services', isSystem: false },
      { id: 'LAB_ATTENDANT', name: 'LAB_ATTENDANT', label: 'Science & ICT Lab Officer', category: 'Operations & Services', isSystem: false },
      { id: 'HEALTH_OFFICER', name: 'HEALTH_OFFICER', label: 'School Nurse / Health Officer', category: 'Operations & Services', isSystem: false },
      { id: 'TRANSPORT_MANAGER', name: 'TRANSPORT_MANAGER', label: 'Transport & Logistics Manager', category: 'Operations & Services', isSystem: false },
      { id: 'DRIVER', name: 'DRIVER', label: 'School Bus Driver', category: 'Operations & Services', isSystem: false },
      { id: 'HOSTEL_WARDEN', name: 'HOSTEL_WARDEN', label: 'Hostel Warden', category: 'Operations & Services', isSystem: false },
      { id: 'RECEPTIONIST', name: 'RECEPTIONIST', label: 'Front Desk Receptionist', category: 'Operations & Services', isSystem: false },
      { id: 'DATA_ENTRY_OFFICER', name: 'DATA_ENTRY_OFFICER', label: 'Data Entry Officer', category: 'Operations & Services', isSystem: false },

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

    function normalizeRoleKey(role) {
      if (!role) return '';
      if (typeof role === 'string') return role.trim();
      return String(role.name || role.id || role.value || '').trim();
    }

    function isStudentAccount(user) {
      return (user?.role || '').toUpperCase() === 'STUDENT' || Boolean(user?.student);
    }

    function roleOptionValue(role) {
      const value = normalizeRoleKey(role);
      return value || 'UNASSIGNED';
    }

    async function loadAllRoleUsers(force = false) {
      if (!force && roleUsersCache) return roleUsersCache;
      if (roleUsersLoadPromise) return roleUsersLoadPromise;

      roleUsersLoadPromise = (async () => {
        const firstPage = await UsersService.list({ page: 1, limit: 100 });
        const users = [...(firstPage.items || [])];
        const pageCount = Math.max(1, Number(firstPage.meta?.pages || firstPage.meta?.totalPages) || 1);
        for (let page = 2; page <= pageCount; page += 1) {
          const nextPage = await UsersService.list({ page, limit: 100 });
          users.push(...(nextPage.items || []));
        }
        roleUsersCache = users;
        return users;
      })();

      try {
        return await roleUsersLoadPromise;
      } finally {
        roleUsersLoadPromise = null;
      }
    }

    function userHasRole(user, roleName) {
      if (user.status === 'ACTIVE' && user.role === roleName) return true;
      return (user.roleAssignments || []).some((assignment) => {
        const name = normalizeRoleKey(assignment.role);
        if (name !== roleName) return false;
        if (assignment.status === 'ACTIVE') return true;
        return assignment.status === 'PENDING'
          && (!assignment.activationExpiresAt || new Date(assignment.activationExpiresAt) > new Date());
      });
    }

    function findExclusiveRoleHolder(roleName, targetUser) {
      if (!EXCLUSIVE_ROLE_NAMES.has(roleName) || !targetUser || !roleUsersCache) return null;
      return roleUsersCache.find((user) => user.id !== targetUser.id
        && (user.schoolId || null) === (targetUser.schoolId || null)
        && userHasRole(user, roleName)) || null;
    }

    function renderRolePicker(id, selectedRoleKeys = new Set(), disabledRoleKeys = new Set(), statusByRole = new Map(), targetUser = null) {
      const categories = [...new Set(ALL_ROLES.map((role) => role.category || 'Defined Roles'))];
      return `
        <details class="role-picker" id="${escapeHtml(id)}">
          <summary><span data-role-picker-label>Select roles</span><span class="role-picker-chevron" aria-hidden="true"></span></summary>
          <div class="role-picker-options">
            ${categories.map((category) => `
              <fieldset class="role-picker-group">
                <legend>${escapeHtml(category)}</legend>
                ${ALL_ROLES.filter((role) => (role.category || 'Defined Roles') === category).map((role) => {
                  const roleKey = roleOptionValue(role);
                  const status = statusByRole.get(roleKey);
                  const holder = findExclusiveRoleHolder(roleKey, targetUser);
                  const disabled = disabledRoleKeys.has(roleKey) || Boolean(holder);
                  const statusLabel = holder ? `Assigned to ${holder.fullName || holder.email || 'another user'}` : status;
                  return `
                    <label class="role-picker-option">
                      <input type="checkbox" value="${escapeHtml(roleKey)}" ${selectedRoleKeys.has(roleKey) ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
                      <span>${escapeHtml(role.label || formatRoleName(roleKey))}${statusLabel ? ` <small>(${escapeHtml(statusLabel)})</small>` : ''}</span>
                    </label>
                  `;
                }).join('')}
              </fieldset>
            `).join('')}
          </div>
        </details>
      `;
    }

    function updateRolePickerLabel(picker) {
      const selectedCount = picker.querySelectorAll('input[type="checkbox"]:checked').length;
      const label = picker.querySelector('[data-role-picker-label]');
      if (label) label.textContent = selectedCount ? `${selectedCount} role${selectedCount === 1 ? '' : 's'} selected` : 'Select roles';
    }

    function getSelectedRoles(picker) {
      return Array.from(picker.querySelectorAll('input[type="checkbox"]:checked'), (input) => input.value);
    }

    // All 56 Backend Modules from College/src/modules/
    let ALL_MODULES = [
      { key: 'admissions', label: 'Admissions & Applications', desc: 'Manage student admission applications, approvals, and student conversions' },
      { key: 'academic_sessions', label: 'Academic Sessions', desc: 'Create and configure academic years and school sessions' },
      { key: 'analytics', label: 'School Analytics', desc: 'View student performance charts, enrollment statistics, and financial overview' },
      { key: 'announcements', label: 'Announcements', desc: 'Publish broadcast announcements to students, parents, and teachers' },
      { key: 'assignments', label: 'Assignments & Homework', desc: 'Create, distribute, grade, and track student assignment submissions' },
      { key: 'attendance', label: 'Student Attendance', desc: 'Mark daily attendance, register class presence, and produce attendance logs' },
      { key: 'audit_logs', label: 'System Audit Logs', desc: 'Track all user actions, system modifications, timestamps, and security events' },
      { key: 'auth', label: 'Authentication & Tokens', desc: 'Configure login protocols, token lifetimes, and security settings' },
      { key: 'class_subjects', label: 'Class Subjects Link', desc: 'Map academic subjects to specific class levels and streams' },
      { key: 'classes', label: 'Classes & Arms', desc: 'Create class levels and arms/sections configured by the school' },
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
      { key: 'klaviyo', label: 'Klaviyo Profile Sync', desc: 'Synchronize user profiles with configured Klaviyo lists' },
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

    const roleMetadata = new Map(ALL_ROLES.map((role) => [role.id, role]));
    try {
      const roleResponse = await RolesService.list();
      ALL_ROLES = roleResponse.items
        .filter((role) => role.isActive !== false)
        .map((role) => {
          const roleName = role.name || role.id;
          const metadata = roleMetadata.get(roleName) || {};
          return {
            ...metadata,
            id: roleName,
            name: roleName,
            label: role.label || metadata.label || titleCaseFromEnum(roleName),
            category: metadata.category || 'Defined Roles',
            description: role.description || metadata.description || `${titleCaseFromEnum(roleName)} role`,
            permissions: role.permissions || [],
            isSystem: Boolean(role.isSystem),
          };
        });
    } catch (error) {
      console.warn('[Access Control] Could not load role definitions from the server.');
    }

    try {
      const moduleResponse = await PermissionsService.modules();
      if (moduleResponse.items.length) {
        const existingModuleMetadata = new Map(ALL_MODULES.map((module) => [module.key, module]));
        ALL_MODULES = moduleResponse.items.map((module) => ({
          key: module.key,
          label: module.displayName,
          desc: existingModuleMetadata.get(module.key)?.desc || `${module.displayName} module`,
          apiRoute: module.apiRoute,
          frontendRoutes: module.frontendRoutes,
          actions: module.actions,
        }));
      }
    } catch (error) {
      console.warn('[Access Control] Could not load the module registry from the server.');
    }

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
        if (btn.dataset.tab === 'role-assignments') loadRoleAssignments();
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
      saveMatrixBtn.addEventListener('click', async () => {
        if (!pendingMatrixChanges.size) {
          Toast.show('info', 'There are no permission changes to save.');
          return;
        }
        saveMatrixBtn.disabled = true;
        try {
          for (const [key, shouldHaveAccess] of pendingMatrixChanges) {
            const [roleName, moduleKey] = key.split(':');
            const role = matrixRoles.find((item) => item.name === roleName);
            if (!role || roleName === 'SUPER_ADMIN') continue;
            const modulePermissions = matrixPermissions.filter((permission) => permission.module === moduleKey);
            const viewPermission = modulePermissions.find((permission) => permission.action === 'view');
            if (shouldHaveAccess && viewPermission) {
              await PermissionsService.assign({ roleId: role.id, permissionId: viewPermission.id });
            } else if (!shouldHaveAccess) {
              const assignedIds = new Set(role.permissions.map((item) => item.permissionId));
              for (const permission of modulePermissions) {
                if (assignedIds.has(permission.id)) {
                  await PermissionsService.revoke({ roleId: role.id, permissionId: permission.id });
                }
              }
            }
          }
          pendingMatrixChanges.clear();
          Toast.success('Role permissions saved to the database.');
          await loadMatrix();
        } catch (error) {
          Toast.error(error.message || 'Some permissions could not be saved. The matrix will be refreshed from the server.');
          pendingMatrixChanges.clear();
          await loadMatrix();
        } finally {
          saveMatrixBtn.disabled = false;
        }
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
          render: (r) => `<a href="javascript:void(0)" class="view-user-details" data-id="${r.id}" style="color:#13283E; font-weight:600;">${escapeHtml(r.fullName || 'Unnamed Account')}</a>`
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
        const isStudent = isStudentAccount(row);
        const canResendApprovalEmail = isActive && row.email && ['STUDENT', 'TEACHER'].includes((row.role || '').toUpperCase());
        return `
          ${isStudent
            ? '<a class="btn btn-outline btn-sm" href="prefects.html">Manage Prefects</a>'
            : `<button type="button" class="btn btn-secondary btn-sm" data-action="change-role">Change Role</button>
               <button type="button" class="btn btn-outline btn-sm" data-action="manage-perms">Grant Permissions</button>`
          }
          ${isActive 
            ? `<button type="button" class="btn btn-secondary btn-sm" data-action="deactivate">Deactivate</button>`
            : `<button type="button" class="btn btn-primary btn-sm" data-action="activate">Activate</button>`
          }
          ${canResendApprovalEmail ? '<button type="button" class="btn btn-outline btn-sm" data-action="resend-approval-email">Resend approval email</button>' : ''}
          <button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>
        `;
      },
      fetchPage: async (page, filters) => {
        try {
          const res = await UsersService.list({ page: 1, limit: 100, search: filters.search || '' });
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
              if (res.communication?.email === true) {
                Toast.success(`Account activated! ${regNo ? `Official Reg No: ${regNo}. ` : ''}The approval email was accepted for delivery.`);
              } else if (res.communication?.errors?.length) {
                Toast.error(`Account activated${regNo ? ` (Reg No: ${regNo})` : ''}, but the approval email could not be sent: ${res.communication.errors.join(' ')}`);
              } else {
                Toast.success(`Account activated! ${regNo ? `Official Reg No: ${regNo}` : ''}`);
              }
              userTable.reload();
            } catch (err) {
              Toast.error(err.message || 'Failed to activate user account.');
            }
          },
        });
      }

      if (action === 'resend-approval-email') {
        try {
          const result = await UsersService.resendApprovalEmail(userId);
          if (result?.email === true) {
            Toast.success(`Approval email accepted by the email provider for ${rowData?.email}.`);
          } else {
            const reason = result?.errors?.join(' ') || 'The email provider rejected the message.';
            Toast.error(`The account remains active, but the approval email could not be sent: ${reason}`);
          }
        } catch (err) {
          Toast.error(err.message || 'Failed to resend the approval email.');
        }
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
        if (isStudentAccount(rowData)) return;
        try {
          await loadAllRoleUsers();
        } catch (error) {
          Toast.error(error.message || 'Could not verify current role holders. Try again.');
          return;
        }
        const currentRole = (rowData?.role || 'STAFF').toUpperCase();
        const currentAssignments = (rowData?.roleAssignments || []).filter((assignment) => ['ACTIVE', 'PENDING'].includes(assignment.status));
        const currentRoleNames = new Set(currentAssignments.map((assignment) => normalizeRoleKey(assignment.role)));
        if (!currentRoleNames.size && currentRole) currentRoleNames.add(currentRole);
        const currentStatusByRole = new Map(currentAssignments.map((assignment) => [normalizeRoleKey(assignment.role), assignment.status]));

        Modal.open({
          title: `Change & Edit User Role — ${userName}`,
          size: 'md',
          bodyHtml: `
            <div class="user-role-modal-wrap" style="padding: 4px 0;">
              <div class="active-role-banner" style="background:#13283E; color:#ffffff; padding:14px 18px; border-radius:4px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; text-transform:uppercase; opacity:0.85;">Current Roles</div>
                  <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                    ${[...currentRoleNames].map((roleName) => {
                      const assignment = currentAssignments.find((item) => normalizeRoleKey(item.role) === roleName);
                      const status = assignment?.status || 'ACTIVE';
                      return `<span class="badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}">${escapeHtml(formatRoleName(roleName))} · ${status}</span>`;
                    }).join('') || '<span>No active or pending roles</span>'}
                  </div>
                </div>
              </div>

              <form id="change-role-form" class="form">
                <div style="margin-bottom:16px;">
                  <label class="form-label" style="font-weight:600; color:#111111; font-size:13px; display:block; margin-bottom:8px;">
                    Select the staff member's active and pending roles
                  </label>
                  ${renderRolePicker('change-role-select', currentRoleNames, new Set(), currentStatusByRole, rowData)}
                </div>

                <div class="modal__footer" style="margin-top:16px; text-align:right;">
                  <button type="submit" class="btn btn-primary" id="submit-role-btn" style="background:#13283E; border-color:#13283E; font-weight:600; padding:8px 18px;">Save Role Changes</button>
                </div>
              </form>
            </div>
          `,
          onMount: (modalEl) => {
            const form = modalEl.querySelector('#change-role-form');
            const rolePicker = modalEl.querySelector('#change-role-select');
            updateRolePickerLabel(rolePicker);
            rolePicker.addEventListener('change', () => updateRolePickerLabel(rolePicker));
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const targetRoles = getSelectedRoles(rolePicker);
              const removed = currentAssignments.filter((assignment) => !targetRoles.includes(normalizeRoleKey(assignment.role)));
              const saveChanges = async () => {
                try {
                  const result = await RolesService.changeUserRole(userId, targetRoles);
                  const pending = (result.assignments || []).filter((assignment) => assignment.status === 'PENDING').length;
                  Toast.success(`Roles updated.${pending ? ` ${pending} new role(s) await staff activation.` : ''}`);
                  if (result.warnings?.length) Toast.error(`Saved, but follow-up failed: ${result.warnings.join('; ')}`);
                  roleUsersCache = null;
                  Modal.close();
                  userTable.reload();
                } catch (err) {
                  Toast.error(err.message || 'Failed to update user roles.');
                }
              };
              if (removed.length) {
                ConfirmDialog.open({
                  title: 'Remove assigned roles?',
                  message: `This will revoke ${removed.map((assignment) => formatRoleName(assignment.role?.name)).join(', ')} immediately.`,
                  confirmLabel: 'Remove Roles',
                  tone: 'danger',
                  onConfirm: saveChanges,
                });
              } else {
                await saveChanges();
              }
            });
          },
        });
      }

      if (action === 'grant-access' || action === 'manage-perms') {
        if (isStudentAccount(rowData)) return;
        try {
          await loadAllRoleUsers();
        } catch (error) {
          Toast.error(error.message || 'Could not verify current role holders. Try again.');
          return;
        }
        const currentRole = (rowData?.role || 'STAFF').toUpperCase();
        const assignments = rowData?.roleAssignments || [];
        const currentAssignmentByRole = new Map(assignments.map((assignment) => [normalizeRoleKey(assignment.role), assignment]));
        const assignedRoleKeys = new Set(assignments
          .filter((assignment) => ['ACTIVE', 'PENDING'].includes(assignment.status))
          .map((assignment) => normalizeRoleKey(assignment.role)));
        Modal.open({
          title: `Grant Access & Role Entitlements — ${userName}`,
          size: 'lg',
          bodyHtml: `
            <div class="grant-access-modal-wrap" style="padding: 4px 0;">
              <div class="user-header-banner" style="background:#13283E; color:#ffffff; padding:14px 18px; border-radius:4px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; opacity:0.85;">User Account Profile</div>
                  <div style="font-size:16px; font-weight:700; margin-top:2px; color:#ffffff;">${escapeHtml(userName)}</div>
                  <div style="font-size:12px; opacity:0.85;">${escapeHtml(rowData ? rowData.email : '')}</div>
                </div>
                <div>
                  <span class="badge" style="background:#1C374F; color:#fff; font-size:12px; padding:4px 12px; font-weight:600; border:1px solid rgba(255,255,255,0.2);">
                    Current Role: ${escapeHtml(formatRoleName(currentRole))}
                  </span>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:10px;">
                <p style="color:#555555; font-size:13px; margin:0; line-height:1.4;">
                  Select one or more backend-defined roles. New assignments remain pending until the staff member activates them.
                </p>
              </div>

              <div class="form-group" style="display:flex; gap:10px; margin-bottom:0;">
                ${renderRolePicker('grant-role-select', new Set(), assignedRoleKeys, new Map([...currentAssignmentByRole].map(([roleKey, assignment]) => [roleKey, assignment.status])), rowData)}
                <button type="button" class="btn btn-primary" id="grant-selected-role-btn" style="background:#13283E; border-color:#13283E; font-weight:600;">Grant Role</button>
              </div>
            </div>
          `,
          onMount: (modalEl) => {
            const grantRoleSelect = modalEl.querySelector('#grant-role-select');
            const grantRoleButton = modalEl.querySelector('#grant-selected-role-btn');
            updateRolePickerLabel(grantRoleSelect);
            grantRoleSelect.addEventListener('change', () => updateRolePickerLabel(grantRoleSelect));
            grantRoleButton.addEventListener('click', async () => {
              const roleIds = getSelectedRoles(grantRoleSelect);
              if (!roleIds.length) {
                Toast.error('Select one or more roles to grant access.');
                return;
              }
              try {
                const result = await RolesService.assign({ userId, roleIds });
                Toast.success(`Assigned ${roleIds.length} role(s) to ${userName}; access is pending staff activation.`);
                if (result.warnings?.length) Toast.error(`Saved, but follow-up failed: ${result.warnings.join('; ')}`);
                roleUsersCache = null;
                Modal.close();
                userTable.reload();
              } catch (err) {
                Toast.error(err.message || 'Failed to grant role permissions.');
              }
            });
          },
        });
      }
    });

    async function loadRoleAssignments(force = false) {
      const assignmentBody = document.getElementById('role-assignments-tbody');
      if (!assignmentBody) return;
      assignmentBody.innerHTML = '<tr><td colspan="5">Loading role assignments...</td></tr>';

      try {
        const users = await loadAllRoleUsers(force);
        const assignments = users.flatMap((user) => {
          if (isStudentAccount(user)) return [];
          return (user.roleAssignments || [])
            .filter((assignment) => ['ACTIVE', 'PENDING'].includes(assignment.status)
              && normalizeRoleKey(assignment.role) !== 'STUDENT')
            .map((assignment) => ({ user, assignment }));
        }).sort((left, right) => {
          const nameOrder = (left.user.fullName || '').localeCompare(right.user.fullName || '');
          return nameOrder || formatRoleName(normalizeRoleKey(left.assignment.role))
            .localeCompare(formatRoleName(normalizeRoleKey(right.assignment.role)));
        });

        if (!assignments.length) {
          assignmentBody.innerHTML = '<tr><td colspan="5">No staff role assignments found.</td></tr>';
          return;
        }

        assignmentBody.innerHTML = assignments.map(({ user, assignment }) => {
          const roleName = normalizeRoleKey(assignment.role);
          const currentUserId = window.CurrentUser?.id || window.CurrentUser?.userId;
          const canRelieve = user.id !== currentUserId;
          return `
            <tr>
              <td data-label="Person">${escapeHtml(user.fullName || 'Unnamed Account')}</td>
              <td data-label="Email">${escapeHtml(user.email || '—')}</td>
              <td data-label="Assigned role"><strong>${escapeHtml(formatRoleName(roleName))}</strong></td>
              <td data-label="Status"><span class="badge ${assignment.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}">${escapeHtml(assignment.status)}</span></td>
              <td data-label="Action" class="cell-actions">
                ${canRelieve
                  ? `<button type="button" class="btn btn-outline-danger btn-sm" data-action="relieve-role" data-user-id="${escapeHtml(user.id)}" data-role-name="${escapeHtml(roleName)}">Relieve role</button>`
                  : '<span class="text-muted">Your account</span>'}
              </td>
            </tr>
          `;
        }).join('');
      } catch (error) {
        assignmentBody.innerHTML = `<tr><td colspan="5" class="text-danger">Could not load role assignments: ${escapeHtml(error.message)}</td></tr>`;
      }
    }

    const roleAssignmentsBody = document.getElementById('role-assignments-tbody');
    if (roleAssignmentsBody) {
      roleAssignmentsBody.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="relieve-role"]');
        if (!button) return;
        const userId = button.dataset.userId;
        const roleName = button.dataset.roleName;
        const user = roleUsersCache?.find((item) => item.id === userId);
        if (!user || isStudentAccount(user)) return;

        const remainingRoles = (user.roleAssignments || [])
          .filter((assignment) => ['ACTIVE', 'PENDING'].includes(assignment.status)
            && normalizeRoleKey(assignment.role) !== roleName)
          .map((assignment) => normalizeRoleKey(assignment.role));
        const userName = user.fullName || user.email || 'this user';

        ConfirmDialog.open({
          title: `Relieve ${userName} of this role?`,
          message: `${formatRoleName(roleName)} access will be removed from this account.`,
          confirmLabel: 'Relieve role',
          tone: 'danger',
          onConfirm: async () => {
            try {
              await RolesService.changeUserRole(userId, remainingRoles);
              Toast.success(`${formatRoleName(roleName)} was removed from ${userName}.`);
              roleUsersCache = null;
              await loadRoleAssignments(true);
              userTable.reload();
            } catch (error) {
              Toast.error(error.message || 'Could not remove this role.');
            }
          },
        });
      });
    }

    const refreshRoleAssignmentsButton = document.getElementById('refresh-role-assignments-btn');
    if (refreshRoleAssignmentsButton) {
      refreshRoleAssignmentsButton.addEventListener('click', () => loadRoleAssignments(true));
    }

    // Tab 2: Full 56-Module Role Permission Matrix
    async function loadMatrix() {
      const tbody = document.getElementById('matrix-tbody');
      const theadRow = document.getElementById('matrix-thead-row');
      if (!tbody || !theadRow) return;

      tbody.innerHTML = '<tr><td colspan="12">Loading 56-Module Permission Matrix...</td></tr>';
      
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          RolesService.list(),
          PermissionsService.list(),
        ]);
        matrixRoles = rolesResponse.items;
        matrixPermissions = permissionsResponse.items;
        pendingMatrixChanges.clear();
        theadRow.innerHTML = '<th>Module Name & Scope</th>' + ALL_ROLES.map((r) => `<th style="text-align:center; font-size:12px;">${escapeHtml(r.label)}</th>`).join('');

        tbody.innerHTML = ALL_MODULES.map((m) => {
          return `
            <tr>
              <td>
                <strong style="color:#111111; font-size:13px;">${escapeHtml(m.label)}</strong>
                <code style="background:#F1F2D6; padding:2px 6px; border-radius:4px; margin-left:6px; color:#13283E; font-size:11px;">${escapeHtml(m.key)}</code>
                <div style="font-size:11px; color:#666666; margin-top:2px;">${escapeHtml(m.desc)}</div>
              </td>
              ${ALL_ROLES.map((r) => {
                const role = matrixRoles.find((item) => item.name === r.id);
                const viewPermission = matrixPermissions.find((permission) => permission.module === m.key && permission.action === 'view');
                const isChecked = r.id === 'SUPER_ADMIN'
                  || Boolean(role && viewPermission && role.permissions.some((item) => item.permissionId === viewPermission.id));
                
                return `
                  <td style="text-align:center;">
                    <input type="checkbox" class="matrix-toggle" data-role-id="${escapeHtml(r.id)}" data-module-key="${escapeHtml(m.key)}" ${isChecked ? 'checked' : ''} ${r.id === 'SUPER_ADMIN' || !role || !viewPermission ? 'disabled' : ''} style="width:16px; height:16px; cursor:pointer;" />
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
        pendingMatrixChanges.set(`${roleId}:${moduleKey}`, isChecked);
        Toast.show('info', 'Permission change pending. Select Save Matrix to apply it.');
      });
    }

    // Tab 3: Load System Roles
    async function loadRoles() {
      const grid = document.getElementById('roles-grid');
      if (!grid) return;
      grid.innerHTML = '<div class="loader"></div>';
      try {
        grid.innerHTML = ALL_ROLES.map((role) => {
          const permissionsByModule = new Map();
          (role.permissions || []).forEach((entry) => {
            const permission = entry.permission || entry;
            if (!permission.module) return;
            if (!permissionsByModule.has(permission.module)) permissionsByModule.set(permission.module, new Set());
            permissionsByModule.get(permission.module).add(permission.action || 'view');
          });

          const assignedModules = ALL_MODULES
            .filter((module) => permissionsByModule.has(module.key))
            .map((module) => ({ ...module, actions: [...permissionsByModule.get(module.key)].sort() }));
          const responsibilities = role.description
            || `${role.label} is responsible for the school operations covered by its assigned module permissions.`;

          return `
            <article class="role-definition-card">
              <div class="role-definition-card__header">
                <h3>${escapeHtml(role.label)}</h3>
                ${role.isSystem ? '<span class="badge badge-outline">System</span>' : '<span class="badge badge-success">Custom</span>'}
              </div>
              <p class="role-definition-card__description">${escapeHtml(responsibilities)}</p>
              <details class="role-module-details">
                <summary>Module access <span>${assignedModules.length}</span></summary>
                ${assignedModules.length ? `
                  <ul class="role-module-list">
                    ${assignedModules.map((module) => `
                      <li>
                        <span class="role-module-list__name">${escapeHtml(module.label || module.key)}</span>
                        <span class="role-module-list__actions">${module.actions.map((action) => `<span>${escapeHtml(action.toUpperCase())}</span>`).join('')}</span>
                      </li>
                    `).join('')}
                  </ul>
                ` : '<p class="role-module-empty">No module permissions are assigned to this role.</p>'}
              </details>
            </article>
          `;
        }).join('');
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
          <td><span class="badge badge-outline" style="border-color:#13283E; color:#13283E;">${escapeHtml(m.key)}</span></td>
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
