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

    const expectedWorkspace = Permissions.getWorkspaceForRole(user.role);
    const actualWorkspace = currentWorkspaceFromPath();

    if (actualWorkspace && actualWorkspace !== expectedWorkspace) {
      window.location.href = `${rootPrefix()}${Permissions.dashboardPathForRole(user.role)}`;
      return;
    }

    window.CurrentUser = user;

    // Refresh the profile, but keep the cached identity if the API is briefly unavailable.
    AuthService.fetchCurrentUser().catch((error) => {
      if (error && error.status === 401) return;
      console.warn('Could not refresh the current user profile.', error);
    });
  })();
})();
