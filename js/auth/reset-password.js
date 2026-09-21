(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const token = getInitialParam('token');
    const form = qs('#reset-form');
    const passwordInput = qs('#new-password');
    const confirmInput = qs('#confirm-password');
    const submitBtn = qs('#reset-submit');
    const errorBox = qs('#reset-error');
    const successBox = qs('#reset-success');
    const missingTokenBox = qs('#missing-token');

    if (!token) {
      form.hidden = true;
      missingTokenBox.hidden = false;
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.hidden = true;

      const newPassword = passwordInput.value;
      const confirmPassword = confirmInput.value;

      const { valid, errors } = Validators.validateForm(
        { newPassword, confirmPassword },
        {
          newPassword: [(v) => Validators.required(v, 'Password'), (v) => Validators.passwordStrength(v)],
          confirmPassword: [(v) => Validators.passwordsMatch(newPassword, v)],
        }
      );

      if (!valid) {
        errorBox.textContent = errors.newPassword || errors.confirmPassword;
        errorBox.hidden = false;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Resetting…';
      try {
        await AuthService.resetPassword({ token, newPassword });
        form.hidden = true;
        successBox.hidden = false;
      } catch (err) {
        errorBox.textContent = err.message || 'This reset link may be invalid or expired.';
        errorBox.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
      }
    });
  });
})();
