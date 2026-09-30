/**
 * Auth guard — include this script (before other page scripts) on every
 * protected page. It:
 *   1. Redirects unauthenticated users to login.
 *   2. Redirects users who land in the wrong role workspace
 *      (e.g. a STUDENT opening /pages/admin/...) to their own dashboard.
 *   3. Exposes window.CurrentUser for the rest of the page's scripts.
 *
 * This is a UX/navigation safeguard. The backend enforces real security.
 */
(function () {
  'use strict';

  function currentWorkspaceFromPath() {
    const match = window.location.pathname.match(/\/pages\/([^/]+)\//);
    return match ? match[1] : null;
  }

  function redirectToLogin() {
    const prefix = rootPrefix();
    window.location.href = `${prefix}login.html`;
  }

  (function guard() {
    if (!AuthService.isAuthenticated()) {
      redirectToLogin();
      return;
    }

    const user = AuthService.getStoredUser();
    if (!user || !user.role) {
      redirectToLogin();
      return;
    }

    window.CurrentUser = user;
    window.authGuardReady = AuthService.fetchCurrentUser().then((freshUser) => {
      const currentUser = freshUser || user;
      window.CurrentUser = currentUser;
      const activeRoles = Array.isArray(currentUser.activeRoles) && currentUser.activeRoles.length
        ? currentUser.activeRoles
        : [currentUser.role];
      const allowedWorkspaces = new Set(activeRoles.map((role) => Permissions.getWorkspaceForRole(role)));
      const actualWorkspace = currentWorkspaceFromPath();
      if (actualWorkspace && !allowedWorkspaces.has(actualWorkspace)) {
        window.location.replace(`${rootPrefix()}${Permissions.dashboardPathForRole(currentUser.role)}`);
        return currentUser;
      }
      const moduleKey = Permissions.getPageModule(window.location.pathname);
      if (moduleKey && !Permissions.canAccessModule(currentUser.role, moduleKey)) {
        const homePath = Permissions.dashboardPathForRole(currentUser.role);
        const homeModule = Permissions.getPageModule(homePath);
        if (homeModule && Permissions.canAccessModule(currentUser.role, homeModule)) {
          window.location.replace(`${rootPrefix()}${homePath}`);
        } else {
          window.location.replace(`${rootPrefix()}access-denied.html`);
        }
      }
      return currentUser;
    }).catch((error) => {
      if (error && error.status === 401) {
        redirectToLogin();
        return null;
      }
      console.warn('Could not refresh the current user profile.', error);
      return user;
    });
  })();
})();
