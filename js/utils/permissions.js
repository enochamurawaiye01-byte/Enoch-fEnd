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
    MANAGEMENT: 'management',
    PRINCIPAL: 'management',
    VICE_PRINCIPAL: 'management',
    HEAD_TEACHER: 'management',
    BURSAR: 'admin', // bursar operates within finance-heavy admin views
    TEACHER: 'teacher',
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

  function canAccessModule(role, moduleKey) {
    const allowed = MODULE_ACCESS[moduleKey];
    if (!allowed) return false;
    return allowed.includes(role);
  }

  global.ENOCH_ROLES = ROLES;
  global.Permissions = {
    ROLES,
    getWorkspaceForRole,
    dashboardPathForRole,
    canAccessModule,
  };
})(window);
