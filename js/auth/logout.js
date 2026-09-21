/**
 * Wires up any [data-action="logout"] element in the current page.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const triggers = qsa('[data-action="logout"]');
    triggers.forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        ConfirmDialog.open({
          title: 'Sign out',
          message: 'Are you sure you want to end your session?',
          confirmLabel: 'Sign Out',
          tone: 'danger',
          onConfirm: async () => {
            await AuthService.logout();
            window.location.href = `${rootPrefix()}login.html`;
          },
        });
      });
    });
  });
})();
