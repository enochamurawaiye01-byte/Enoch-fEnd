/**
 * login.html controller
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    const getRedirectPath = (user) => {
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        const destination = new URL(returnTo, window.location.origin);
        if (destination.origin === window.location.origin) return destination.href;
      }
      return Permissions.dashboardPathForRole(user.role);
    };

    // If already authenticated, skip straight to the right dashboard.
    if (AuthService.isAuthenticated()) {
      const user = AuthService.getStoredUser();
      if (user && user.role) {
        window.location.href = getRedirectPath(user);
        return;
      }
    }

    const form = qs('#login-form');
    const identifierInput = qs('#login-identifier');
    const passwordInput = qs('#password');
    const togglePasswordBtn = qs('#toggle-password');
    const submitBtn = qs('#login-submit');
    const errorBox = qs('#login-error');
    const fieldErrorIdentifier = qs('#error-identifier');
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
        errorBox.style.color = '#A33B45';
        errorBox.style.background = '#fff5f5';
        errorBox.style.border = '1px solid #fecaca';
      }
    }

    function clearErrors() {
      if (errorBox) {
        errorBox.hidden = true;
        errorBox.textContent = '';
      }
      if (fieldErrorIdentifier) {
        fieldErrorIdentifier.textContent = '';
        fieldErrorIdentifier.style.display = 'none';
      }
      if (fieldErrorPassword) {
        fieldErrorPassword.textContent = '';
        fieldErrorPassword.style.display = 'none';
      }
      if (identifierInput) identifierInput.classList.remove('input-error');
      if (passwordInput) passwordInput.classList.remove('input-error');
    }

    function setFieldError(el, errSpan, msg) {
      if (errSpan) {
        errSpan.textContent = msg;
        errSpan.style.display = 'block';
        errSpan.style.color = '#A33B45';
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

      const identifier = identifierInput.value.trim();
      const password = passwordInput.value;
      const isEmail = identifier.includes('@');

      const { valid, errors } = Validators.validateForm(
        { identifier, password },
        {
          identifier: [
            (v) => Validators.required(v, 'Email address or MIC registration number'),
            (v) => isEmail ? Validators.email(v) : null,
          ],
          password: [(v) => Validators.required(v, 'Password')],
        }
      );

      if (!valid) {
        if (errors.identifier) setFieldError(identifierInput, fieldErrorIdentifier, errors.identifier);
        if (errors.password) setFieldError(passwordInput, fieldErrorPassword, errors.password);
        showError('Please fix the highlighted errors before signing in.');
        return;
      }

      setLoading(true);
      try {
        const credentials = isEmail
          ? { email: identifier, password }
          : { registrationNumber: identifier, password };
        const user = await AuthService.login(credentials);
        Toast.show('success', `Welcome back, ${user.firstName || user.name || user.fullName || 'there'}.`);
        window.location.href = getRedirectPath(user);
      } catch (err) {
        const errorCode = err.payload?.code || err.payload?.error?.code || err.payload?.data?.code;
        if (errorCode === 'STUDENT_REGISTRATION_LOGIN_REQUIRED') {
          showError('Your student account has completed its first login. Sign in with your MIC registration number and password.');
        } else {
          showError(err.message || 'Unable to sign in. Please check your credentials.');
        }
      } finally {
        setLoading(false);
      }
    });
  });
})();
