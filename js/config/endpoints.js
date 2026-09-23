/**
 * ENOCH INTERNATIONAL COLLEGE ERP
 * Centralized endpoint registry.
 *
 * All paths are relative to ENOCH_CONFIG.API_BASE_URL (which already
 * includes the /api prefix). Services must import from here rather
 * than hard-coding paths.
 *
 * NOTE: If your live backend's route names differ from these, this is the
 * single place to fix it — every service file will automatically follow.
 */

(function (global) {
  'use strict';

  const id = (p) => `/${p}`;

  global.ENOCH_ENDPOINTS = {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      CHANGE_PASSWORD: '/auth/change-password',
    },

    USERS: {
      BASE: '/users',
      BY_ID: (userId) => `/users/${userId}`,
      STATUS: (userId) => `/users/${userId}/status`,
    },

    STUDENTS: {
      BASE: '/students',
      ME: '/students/me',
      BY_ID: (studentId) => `/students/${studentId}`,
      PROFILE_PICTURE: '/students/me/profile-picture',
      DEACTIVATE: (studentId) => `/students/${studentId}/deactivate`,
      PROFILE: (studentId) => `/students/${studentId}/profile`,
    },

    PARENTS: {
      BASE: '/parents',
      BY_ID: (parentId) => `/parents/${parentId}`,
      CHILDREN: (parentId) => `/parents/${parentId}/children`,
    },

    TEACHERS: {
      BASE: '/teachers',
      BY_ID: (teacherId) => `/teachers/${teacherId}`,
      MY_ASSIGNMENTS: '/teachers/me/assignments',
      ASSIGNMENTS: (teacherId) => `/teachers/${teacherId}/assignments`,
    },

    ACADEMIC_SESSIONS: {
      BASE: '/academic-sessions',
      BY_ID: (sessionId) => `/academic-sessions/${sessionId}`,
      ACTIVATE: (sessionId) => `/academic-sessions/${sessionId}/activate`,
      CLOSE: (sessionId) => `/academic-sessions/${sessionId}/close`,
      CURRENT: '/academic-sessions/current',
    },

    TERMS: {
      BASE: '/terms',
      BY_SESSION: (sessionId) => `/terms/sessions/${sessionId}`,
      BY_ID: (termId) => `/terms/${termId}`,
      ACTIVATE: (termId) => `/terms/${termId}/activate`,
      CLOSE: (termId) => `/terms/${termId}/close`,
      CURRENT: '/terms/current',
    },

    CLASSES: {
      BASE: '/classes',
      BY_ID: (classId) => `/classes/${classId}`,
      ARMS: (classId) => `/classes/${classId}/arms`,
      STUDENTS: (classId) => `/classes/${classId}/students`,
    },

    CLASS_ARMS: {
      BASE: '/classes',
      BY_ID: (armId) => `/classes/${armId}`,
    },

    SUBJECTS: {
      BASE: '/subjects',
      BY_ID: (subjectId) => `/subjects/${subjectId}`,
    },

    DEPARTMENTS: {
      BASE: '/departments',
      BY_ID: (deptId) => `/departments/${deptId}`,
    },

    CLASS_SUBJECTS: {
      BASE: '/class-subjects',
      BY_ID: (id_) => `/class-subjects/${id_}`,
      BY_CLASS: (classId) => `/class-subjects/class/${classId}`,
    },

    TEACHER_ASSIGNMENTS: {
      BASE: '/teacher-assignments',
      BY_ID: (id_) => `/teacher-assignments/${id_}`,
    },

    ENROLLMENTS: {
      BASE: '/enrollments',
      BY_ID: (id_) => `/enrollments/${id_}`,
    },

    PROMOTIONS: {
      BASE: '/promotions',
      BY_ID: (id_) => `/promotions/${id_}`,
      HISTORY: (studentId) => `/promotions/student/${studentId}`,
    },

    ATTENDANCE: {
      BASE: '/attendance',
      BY_ID: (id_) => `/attendance/${id_}`,
      CLASS: (classId) => `/attendance/class/${classId}`,
      STUDENT: (studentId) => `/attendance/student/${studentId}`,
      STATS: '/attendance/stats',
      MARK: '/attendance/mark',
    },

    TIMETABLE: {
      BASE: '/timetable',
      BY_ID: (id_) => `/timetable/${id_}`,
      CLASS: '/timetable',
      TEACHER: '/timetable',
    },

    LESSONS: {
      BASE: '/lessons',
      BY_ID: (id_) => `/lessons/${id_}`,
    },

    ASSIGNMENTS: {
      BASE: '/assignments',
      BY_ID: (id_) => `/assignments/${id_}`,
      SUBMISSIONS: (assignmentId) => `/assignments/${assignmentId}/submissions`,
    },

    EXAMINATIONS: {
      BASE: '/examinations',
      BY_ID: (id_) => `/examinations/${id_}`,
    },

    QUESTIONS: {
      BASE: '/question-bank',
      BY_ID: (id_) => `/question-bank/${id_}`,
      BY_EXAM: (examId) => `/question-bank?examinationId=${examId}`,
    },

    EXAM_ATTEMPTS: {
      BASE: '/exam-attempts',
      BY_ID: (id_) => `/exam-attempts/${id_}`,
      BY_STUDENT: (studentId) => `/exam-attempts/student/${studentId}`,
    },

    RESULTS: {
      BASE: '/results',
      TEACHER: '/results/teacher',
      BY_ID: (id_) => `/results/${id_}`,
      STUDENT: (studentId) => `/results/student/${studentId}`,
      CLASS: (classId) => `/results/class/${classId}`,
      PUBLISH: (id_) => `/results/${id_}/publish`,
    },

    TRANSCRIPTS: {
      BASE: '/transcripts',
      STUDENT: (studentId) => `/transcripts/student/${studentId}`,
    },

    FEES: {
      BASE: '/fees',
      BY_ID: (id_) => `/fees/${id_}`,
    },

    FEE_ACCOUNTS: {
      BASE: '/fees/accounts',
      BY_STUDENT: (studentId) => `/fees/balance/${studentId}`,
    },

    INVOICES: {
      BASE: '/invoices',
      BY_ID: (id_) => `/invoices/${id_}`,
    },

    PAYMENTS: {
      BASE: '/payments',
      BY_ID: (id_) => `/payments/${id_}`,
      BY_STUDENT: (studentId) => `/payments/student/${studentId}`,
    },

    RECEIPTS: {
      BASE: '/receipts',
      BY_ID: (id_) => `/receipts/${id_}`,
    },

    FINANCIAL_REPORTS: {
      FINANCIAL: '/reports/financial',
    },

    LIBRARY: {
      BOOKS: '/library/books',
      BOOK_BY_ID: (id_) => `/library/books/${id_}`,
      MEMBERS: '/library/books',
      BORROW: '/library/loans',
      RETURN: (id_) => `/library/loans/${id_}/return`,
      OVERDUE: '/library/loans',
    },

    INVENTORY: {
      ITEMS: '/inventory/items',
      ITEM_BY_ID: (id_) => `/inventory/items/${id_}`,
      CATEGORIES: '/inventory/categories',
      MOVEMENTS: '/inventory/movements',
    },

    TRANSPORT: {
      VEHICLES: '/transport/vehicles',
      DRIVERS: '/transport/drivers',
      ROUTES: '/transport/routes',
      ASSIGNMENTS: '/transport/assignments',
    },

    HOSTEL: {
      HOSTELS: '/hostel',
      ROOMS: '/hostel/rooms',
      ALLOCATIONS: '/hostel/allocations',
    },

    MEDICAL: {
      RECORDS: '/medical/profiles',
      RECORD_BY_ID: (id_) => `/medical/profiles/${id_}`,
      VISITS: '/medical/visits',
    },

    DISCIPLINE: {
      BASE: '/discipline',
      BY_ID: (id_) => `/discipline/${id_}`,
    },

    ANNOUNCEMENTS: {
      BASE: '/announcements',
      BY_ID: (id_) => `/announcements/${id_}`,
      PUBLISH: (id_) => `/announcements/${id_}/publication`,
    },

    NOTIFICATIONS: {
      BASE: '/notifications',
      UNREAD_COUNT: '/notifications/unread-count',
      MARK_READ: (id_) => `/notifications/${id_}/read`,
      MARK_ALL_READ: '/notifications/mark-all-read',
    },

    MESSAGES: {
      INBOX: '/messaging/inbox',
      SENT: '/messaging/sent',
      BY_ID: (id_) => `/messaging/${id_}`,
      COMPOSE: '/messaging',
    },

    NEWS: {
      BASE: '/news',
      BY_ID: (id_) => `/news/${id_}`,
      PUBLISH: (id_) => `/news/${id_}/publication`,
    },

    EVENTS: {
      BASE: '/events',
      BY_ID: (id_) => `/events/${id_}`,
      PUBLISH: (id_) => `/events/${id_}/publication`,
    },

    GALLERY: {
      ALBUMS: '/gallery',
      ALBUM_BY_ID: (id_) => `/gallery/${id_}`,
      IMAGES: (albumId) => `/gallery/${albumId}/images`,
    },

    DOCUMENTS: {
      BASE: '/documents',
      BY_ID: (id_) => `/documents/${id_}`,
      DOWNLOAD: (id_) => `/documents/${id_}/download`,
    },

    REPORTS: {
      ACADEMIC: '/reports/academic',
      ATTENDANCE: '/reports/attendance',
      FINANCIAL: '/reports/financial',
      EXAMINATION: '/reports/examination',
      OPERATIONAL: '/reports/operational',
    },

    AUDIT_LOGS: {
      BASE: '/audit-logs',
      BY_ID: (id_) => `/audit-logs/${id_}`,
    },

    SETTINGS: {
      SCHOOL: '/settings/school',
      PROFILE: '/settings/profile',
      PREFERENCES: '/settings/preferences',
    },

    DASHBOARD: {
      ADMIN: '/analytics/dashboard',
      MANAGEMENT: '/management/dashboard',
      TEACHER: '/dashboard/teacher',
      STUDENT: '/dashboard/student',
      PARENT: '/dashboard/parent',
    },
  };
})(window);
