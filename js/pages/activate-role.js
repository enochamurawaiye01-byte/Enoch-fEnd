(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('activation-status');
    const loginLink = document.getElementById('activation-login-link');
    const activateButton = document.getElementById('activate-role-button');
    const dashboardLink = document.getElementById('activation-dashboard-link');
    const assignmentId = new URLSearchParams(window.location.search).get('assignmentId');

    if (!assignmentId) {
      status.textContent = 'This activation link is missing its role assignment.';
      return;
    }

    if (!AuthService.isAuthenticated()) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      loginLink.href = `login.html?returnTo=${encodeURIComponent(returnTo)}`;
      loginLink.hidden = false;
      status.textContent = 'Sign in with the account that received this role assignment to activate it.';
      return;
    }

    status.textContent = 'This role is assigned to your signed-in account. Activate it to enable its permissions.';
    activateButton.hidden = false;
    dashboardLink.hidden = false;

    activateButton.addEventListener('click', async () => {
      activateButton.disabled = true;
      status.textContent = 'Activating your role…';
      try {
        const result = await RolesService.activateRole(assignmentId);
        await AuthService.fetchCurrentUser();
        status.textContent = result.message || 'Role activated. Your access has been updated.';
        activateButton.hidden = true;
        dashboardLink.href = Permissions.dashboardPathForRole(AuthService.getStoredUser()?.role);
        dashboardLink.textContent = 'Continue to your workspace';
      } catch (error) {
        status.textContent = error.message || 'This role could not be activated. Sign in with the assigned account or ask an administrator to reassign it.';
        activateButton.disabled = false;
      }
    });
  });
})();