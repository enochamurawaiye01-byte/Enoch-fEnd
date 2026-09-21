/**
 * main.js — bootstraps the application shell (sidebar + topbar) on every
 * protected page. Pages declare their title via <body data-page-title="...">
 * and an optional <body data-breadcrumb="...">.
 * Must load AFTER auth-guard.js (so window.CurrentUser is set) and after
 * all component scripts.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Apply persisted theme before paint-sensitive components render.
    document.documentElement.dataset.theme = Storage.getTheme();

    if (!window.CurrentUser) return; // auth-guard already handled redirect

    const user = window.CurrentUser;
    const workspace = Permissions.getWorkspaceForRole(user.role);
    const pageTitle = document.body.dataset.pageTitle || 'Dashboard';
    const breadcrumb = document.body.dataset.breadcrumb || '';

    Sidebar.render('app-sidebar', workspace, titleCaseFromEnum(user.role));
    Navbar.render('app-navbar', { pageTitle, breadcrumb, user });
  });
})();
