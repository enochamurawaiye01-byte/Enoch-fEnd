(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#register-form');
    const submitErrorBox = qs('#submit-error-box');
    const successBox = qs('#register-success');
    const submitButton = qs('#register-submit');
    const roleSelect = qs('#role');
    const teacherFields = qs('#teacher-fields');
    const parentFields = qs('#parent-fields');
    const passwordInput = qs('#password');
    const pwContainer = qs('#pw-strength-container');
    const pwBar = qs('#pw-strength-bar');
    const pwText = qs('#pw-strength-text');

    // Role-dependent fields toggle
    roleSelect.addEventListener('change', () => {
      const isTeacher = roleSelect.value === 'TEACHER';
      const isParent = roleSelect.value === 'PARENT';
      teacherFields.hidden = !isTeacher;
      parentFields.hidden = !isParent;
      teacherFields.querySelectorAll('input').forEach((input) => { input.required = isTeacher; });
      parentFields.querySelectorAll('input').forEach((input) => { input.required = isParent; });
      submitButton.textContent = isTeacher ? 'Submit Teacher Application' : isParent ? 'Submit Parent Application' : 'Submit Student Application';
    });

    // Password Strength Tracker
    if (passwordInput && pwContainer) {
      passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        if (!val) {
          pwContainer.style.display = 'none';
          return;
        }
        pwContainer.style.display = 'block';

        let score = 0;
        if (val.length >= 6) score += 20;
        if (val.length >= 8) score += 20;
        if (/[A-Z]/.test(val)) score += 20;
        if (/[0-9]/.test(val)) score += 20;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(val)) score += 20;

        pwBar.style.width = score + '%';
        if (score <= 40) {
          pwBar.style.background = '#ef4444';
          pwText.style.color = '#ef4444';
          pwText.textContent = 'Weak';
        } else if (score <= 60) {
          pwBar.style.background = '#f59e0b';
          pwText.style.color = '#f59e0b';
          pwText.textContent = 'Fair';
        } else if (score <= 80) {
          pwBar.style.background = '#04A1D0';
          pwText.style.color = '#04A1D0';
          pwText.textContent = 'Good';
        } else {
          pwBar.style.background = '#10b981';
          pwText.style.color = '#10b981';
          pwText.textContent = 'Strong ✓';
        }
      });
    }

    function clearErrors() {
      if (submitErrorBox) {
        submitErrorBox.hidden = true;
        submitErrorBox.textContent = '';
      }
      form.querySelectorAll('.form-error').forEach((el) => {
        el.textContent = '';
        el.style.display = 'none';
      });
      form.querySelectorAll('input, select').forEach((el) => {
        el.classList.remove('input-error');
      });
    }

    function setFieldError(fieldId, msg) {
      const errEl = qs(`#error-${fieldId}`);
      const inputEl = qs(`#${fieldId}`);
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
        errEl.style.color = '#B02032';
        errEl.style.fontWeight = 'bold';
        errEl.style.fontSize = '12px';
        errEl.style.marginTop = '4px';
      }
      if (inputEl) {
        inputEl.classList.add('input-error');
        inputEl.style.borderColor = '#B02032';
      }
    }

    function showSubmitError(msg) {
      if (submitErrorBox) {
        submitErrorBox.textContent = msg;
        submitErrorBox.hidden = false;
        submitErrorBox.style.color = '#B02032';
        submitErrorBox.style.background = '#fff5f5';
        submitErrorBox.style.border = '1px solid #fecaca';
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearErrors();
      if (successBox) successBox.hidden = true;

      const rawData = Object.fromEntries(
        Array.from(new FormData(form).entries()).filter(([, value]) => String(value).trim() !== '')
      );

      // Validate required fields
      let hasError = false;
      if (!rawData.firstName) { setFieldError('firstName', 'First name is required.'); hasError = true; }
      if (!rawData.lastName) { setFieldError('lastName', 'Last name is required.'); hasError = true; }
      if (!rawData.email) { setFieldError('email', 'Email address is required.'); hasError = true; }
      else if (!/\S+@\S+\.\S+/.test(rawData.email)) { setFieldError('email', 'Please enter a valid email address.'); hasError = true; }
      
      if (!rawData.phoneNumber) { setFieldError('phoneNumber', 'Phone number is required.'); hasError = true; }

      if (!rawData.password) { setFieldError('password', 'Password is required.'); hasError = true; }
      else if (rawData.password.length < 8) { setFieldError('password', 'Password must be at least 8 characters.'); hasError = true; }

      if (rawData.password !== rawData.confirmPassword) {
        setFieldError('confirmPassword', 'Passwords do not match.');
        hasError = true;
      }

      if (rawData.role === 'TEACHER' && !rawData.staffNumber) {
        setFieldError('staffNumber', 'Staff identification number is required for teacher registration.');
        hasError = true;
      }

      if (rawData.role === 'PARENT' && !rawData.childRegistrationNumber) {
        setFieldError('childRegistrationNumber', 'Child registration number is required for parent registration.');
        hasError = true;
      }

      if (hasError) {
        showSubmitError('Please fix the highlighted input errors before submitting your application.');
        return;
      }

      submitButton.disabled = true;
      const origText = submitButton.textContent;
      submitButton.textContent = 'Submitting application...';

      try {
        await AuthService.register(rawData);
        if (qs('#marketingConsent')?.checked) {
          ApiClient.post('/klaviyo/subscribe', {
            email: rawData.email,
            firstName: rawData.firstName,
            lastName: rawData.lastName,
            phoneNumber: rawData.phoneNumber,
            consent: true,
          }).catch(() => {});
        }
        form.hidden = true;
        if (successBox) {
          successBox.textContent = 'Application submitted successfully! Your account is pending administrator approval before you can sign in.';
          successBox.hidden = false;
        }
      } catch (error) {
        const errorMsg = error.message || 'Unable to submit application. Please check your inputs.';
        showSubmitError(errorMsg);
        
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach(err => {
            if (err.field && err.field !== 'root') setFieldError(err.field, err.message);
          });
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = origText;
      }
    });
  });
})();
