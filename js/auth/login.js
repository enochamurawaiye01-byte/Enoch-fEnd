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

    if (togglePasswordBtn && passwordInput) {
      togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
      });
    }

    function showError(message) {
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        errorBox.style.color = '#B02032';
        errorBox.style.background = '#fff5f5';
        errorBox.style.border = '1px solid #fecaca';
      }
    }

    function clearErrors() {
      if (errorBox) {
        errorBox.hidden = true;
        errorBox.textContent = '';
      }
      if (fieldErrorEmail) {
        fieldErrorEmail.textContent = '';
        fieldErrorEmail.style.display = 'none';
      }
      if (fieldErrorPassword) {
        fieldErrorPassword.textContent = '';
        fieldErrorPassword.style.display = 'none';
      }
      if (emailInput) emailInput.classList.remove('input-error');
      if (passwordInput) passwordInput.classList.remove('input-error');
    }

    function setFieldError(el, errSpan, msg) {
      if (errSpan) {
        errSpan.textContent = msg;
        errSpan.style.display = 'block';
        errSpan.style.color = '#B02032';
        errSpan.style.fontWeight = 'bold';
        errSpan.style.fontSize = '12px';
        errSpan.style.marginTop = '4px';
      }
      if (el) el.classList.add('input-error');
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
        if (errors.email) setFieldError(emailInput, fieldErrorEmail, errors.email);
        if (errors.password) setFieldError(passwordInput, fieldErrorPassword, errors.password);
        showError('Please fix the highlighted errors before signing in.');
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
