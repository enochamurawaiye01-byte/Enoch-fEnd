/**
 * login.html controller
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // If already authenticated, skip straight to the right dashboard.
    if (AuthService.isAuthenticated()) {
      const user = AuthService.getStoredUser();
      if (user && user.role) {
        window.location.href = Permissions.dashboardPathForRole(user.role);
        return;
      }
    }

    const form = qs('#login-form');
    const emailInput = qs('#email');
    const passwordInput = qs('#password');
    const togglePasswordBtn = qs('#toggle-password');
    const submitBtn = qs('#login-submit');
    const errorBox = qs('#login-error');
    const fieldErrorEmail = qs('#error-email');
    const fieldErrorPassword = qs('#error-password');

    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      showError('Your session has expired. Please log in again.');
    }

    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
    });

    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    function clearErrors() {
      errorBox.hidden = true;
      errorBox.textContent = '';
      fieldErrorEmail.textContent = '';
      fieldErrorPassword.textContent = '';
      emailInput.classList.remove('input-error');
      passwordInput.classList.remove('input-error');
    }

    function setLoading(isLoading) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.textContent = isLoading ? 'Signing in…' : 'Sign In';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      const { valid, errors } = Validators.validateForm(
        { email, password },
        {
          email: [(v) => Validators.required(v, 'Email address'), (v) => Validators.email(v)],
          password: [(v) => Validators.required(v, 'Password')],
        }
      );

      if (!valid) {
        if (errors.email) {
          fieldErrorEmail.textContent = errors.email;
          emailInput.classList.add('input-error');
        }
        if (errors.password) {
          fieldErrorPassword.textContent = errors.password;
          passwordInput.classList.add('input-error');
        }
        return;
      }

      setLoading(true);
      try {
        const user = await AuthService.login({ email, password });
        Toast.show('success', `Welcome back, ${user.firstName || user.name || user.fullName || 'there'}.`);
        window.location.href = Permissions.dashboardPathForRole(user.role);
      } catch (err) {
        showError(err.message || 'Unable to sign in. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    });
  });
})();
