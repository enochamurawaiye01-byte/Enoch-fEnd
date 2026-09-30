/**
 * ENOCH INTERNATIONAL COLLEGE ERP
 * Frontend role-based access helpers.
 *
 * IMPORTANT: This module improves UX (hiding irrelevant nav/actions,
 * redirecting to the right dashboard) but is NOT a security boundary.
 * The backend is the final authority — every request still requires a
 * valid JWT and is subject to backend authorization.
 */
(function (global) {
  'use strict';

  const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGEMENT: 'MANAGEMENT',
    PRINCIPAL: 'PRINCIPAL',
    VICE_PRINCIPAL: 'VICE_PRINCIPAL',
    HEAD_TEACHER: 'HEAD_TEACHER',
    BURSAR: 'BURSAR',
    TEACHER: 'TEACHER',
    STAFF: 'STAFF',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
  };

  // Maps a backend role to the workspace ("shell") it belongs to.
  // A workspace corresponds to a folder under /pages/.
  const ROLE_WORKSPACE = {
    SUPER_ADMIN: 'admin',
    ADMIN: 'admin',
    SCHOOL_ADMINISTRATOR: 'admin',
    ADMIN_MANAGER: 'admin',
    HR_MANAGER: 'admin',
    ACCOUNTANT: 'admin',
    FINANCE_OFFICER: 'admin',
    PROCUREMENT_OFFICER: 'admin',
    STOREKEEPER: 'admin',
    REGISTRAR: 'admin',
    ADMISSIONS_OFFICER: 'admin',
    EXAMINATION_OFFICER: 'admin',
    EXAM_OFFICER: 'admin',
    ICT_ADMINISTRATOR: 'admin',
    TRANSPORT_MANAGER: 'admin',
    DRIVER: 'admin',
    HEALTH_OFFICER: 'admin',
    HOSTEL_WARDEN: 'admin',
    RECEPTIONIST: 'admin',
    DATA_ENTRY_OFFICER: 'admin',
    MANAGEMENT: 'management',
    PRINCIPAL: 'management',
    VICE_PRINCIPAL: 'management',
    VICE_PRINCIPAL_ACADEMICS: 'management',
    VICE_PRINCIPAL_ADMIN: 'management',
    HEAD_TEACHER: 'management',
    DEPUTY_HEAD_TEACHER: 'management',
    ACADEMIC_COORDINATOR: 'management',
    HEAD_OF_DEPARTMENT: 'management',
    SUBJECT_COORDINATOR: 'management',
    DEAN_OF_STUDENTS: 'management',
    BURSAR: 'admin', // bursar operates within finance-heavy admin views
    TEACHER: 'teacher',
    SENIOR_TEACHER: 'teacher',
    CLASS_TEACHER: 'teacher',
    SUBJECT_TEACHER: 'teacher',
    SCHOOL_COUNSELOR: 'teacher',
    LIBRARIAN: 'teacher',
    LAB_ATTENDANT: 'teacher',
    INVENTORY_OFFICER: 'teacher',
    SECURITY_CHIEF: 'teacher',
    STAFF: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent',
  };

  function getWorkspaceForRole(role) {
    return ROLE_WORKSPACE[role] || 'student';
  }

  function dashboardPathForRole(role) {
    const workspace = getWorkspaceForRole(role);
    return `pages/${workspace}/dashboard.html`;
  }

  /**
   * Coarse-grained module visibility per role, used to build the sidebar
   * and to gate top-level areas. Fine-grained CRUD permission is always
   * re-validated by the backend.
   */
  const MODULE_ACCESS = {
    users: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    students: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL, ROLES.HEAD_TEACHER, ROLES.TEACHER],
    parents: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT],
    teachers: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL],
    academics: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL, ROLES.HEAD_TEACHER],
    teaching: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL, ROLES.HEAD_TEACHER, ROLES.TEACHER],
    attendance: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER, ROLES.HEAD_TEACHER],
    examinations: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER, ROLES.HEAD_TEACHER],
    results: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER, ROLES.HEAD_TEACHER],
    finance: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BURSAR, ROLES.MANAGEMENT],
    library: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    inventory: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    transport: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    hostel: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    medical: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
    discipline: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.HEAD_TEACHER, ROLES.TEACHER],
    announcements: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL],
    news: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT],
    events: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT],
    gallery: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT],
    reports: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL, ROLES.BURSAR],
    auditLogs: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    settings: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL, ROLES.HEAD_TEACHER, ROLES.BURSAR, ROLES.TEACHER, ROLES.STAFF, ROLES.STUDENT, ROLES.PARENT],
  };

  const PAGE_MODULES = {
    'dashboard.html': 'dashboards',
    'access-control.html': 'permissions',
    'users.html': 'users',
    'applicants.html': 'admissions',
    'academics.html': 'classes',
    'students.html': 'students',
    'student-details.html': 'students',
    'child-details.html': 'parents',
    'parents.html': 'parents',
    'teachers.html': 'teachers',
    'academic-sessions.html': 'academic_sessions',
    'terms.html': 'terms',
    'classes.html': 'classes',
    'subjects.html': 'subjects',
    'departments.html': 'departments',
    'class-subjects.html': 'class_subjects',
    'teacher-assignments.html': 'teacher_assignments',
    'enrollments.html': 'enrollments',
    'promotions.html': 'promotions',
    'attendance.html': 'attendance',
    'timetable.html': 'timetable',
    'lessons.html': 'lessons',
    'assignments.html': 'assignments',
    'examinations.html': 'examinations',
    'questions.html': 'question_bank',
    'exam-attempts.html': 'exam_attempts',
    'results.html': 'results',
    'transcripts.html': 'transcripts',
    'transcript.html': 'transcripts',
    'fees.html': 'fees',
    'fee-accounts.html': 'fees',
    'invoices.html': 'invoices',
    'payments.html': 'payments',
    'receipts.html': 'receipts',
    'financial-reports.html': 'reports',
    'finance.html': 'payments',
    'library.html': 'library',
    'inventory.html': 'inventory',
    'transport.html': 'transport',
    'hostel.html': 'hostel',
    'medical.html': 'medical',
    'discipline.html': 'discipline',
    'announcements.html': 'announcements',
    'notifications.html': 'notifications',
    'messages.html': 'messaging',
    'news.html': 'news',
    'events.html': 'events',
    'gallery.html': 'gallery',
    'documents.html': 'documents',
    'reports.html': 'reports',
    'audit-logs.html': 'audit_logs',
    'settings.html': 'settings',
    'profile.html': 'students',
    'children.html': 'parents',
  };

  function canAccessModule(role, moduleKey) {
    const currentUser = global.CurrentUser || (global.Storage && Storage.getUser());
    if (currentUser && Array.isArray(currentUser.modulePermissions)) {
      return currentUser.modulePermissions.includes(moduleKey);
    }
    const allowed = MODULE_ACCESS[moduleKey];
    if (!allowed) return false;
    return allowed.includes(role);
  }

  function getPageModule(pathname) {
    const filename = String(pathname || '').split('/').pop();
    return PAGE_MODULES[filename] || null;
  }

  global.ENOCH_ROLES = ROLES;
  global.Permissions = {
    ROLES,
    getWorkspaceForRole,
    dashboardPathForRole,
    canAccessModule,
    getPageModule,
  };
})(window);
