(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#forgot-form');
    const identifierInput = qs('#identifier');
    const submitBtn = qs('#forgot-submit');
    const successBox = qs('#forgot-success');
    const errorBox = qs('#forgot-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.hidden = true;
      successBox.hidden = true;

      const identifier = identifierInput.value.trim();
      const err = Validators.required(identifier, 'Email') || Validators.email(identifier);
      if (err) {
        errorBox.textContent = err;
        errorBox.hidden = false;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      try {
        await AuthService.forgotPassword(identifier);
        successBox.textContent = 'If an account matches those details, a password reset link has been sent.';
        successBox.hidden = false;
        form.reset();
      } catch (e2) {
        errorBox.textContent = e2.message || 'Unable to process this request right now.';
        errorBox.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
      }
    });
  });
})();
