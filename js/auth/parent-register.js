(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('parent-register-form');
    const submitErrorBox = document.getElementById('parent-register-error');
    const successBox = document.getElementById('parent-register-success');
    const submitButton = document.getElementById('parent-register-submit');
    const passwordInput = document.getElementById('password');
    const pwContainer = document.getElementById('pw-strength-container');
    const pwBar = document.getElementById('pw-strength-bar');
    const pwText = document.getElementById('pw-strength-text');

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
      const errEl = document.getElementById(`error-${fieldId}`);
      const inputEl = document.getElementById(fieldId);
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

      let hasError = false;
      if (!rawData.childRegistrationNumber) { setFieldError('childRegistrationNumber', 'Child registration number is required.'); hasError = true; }
      if (!rawData.firstName) { setFieldError('firstName', 'First name is required.'); hasError = true; }
      if (!rawData.lastName) { setFieldError('lastName', 'Last name is required.'); hasError = true; }
      if (!rawData.relationship) { setFieldError('relationship', 'Relationship to child is required.'); hasError = true; }
      if (!rawData.email) { setFieldError('email', 'Email address is required.'); hasError = true; }
      else if (!/\S+@\S+\.\S+/.test(rawData.email)) { setFieldError('email', 'Please enter a valid email address.'); hasError = true; }
      if (!rawData.phoneNumber) { setFieldError('phoneNumber', 'Phone number is required.'); hasError = true; }

      if (!rawData.password) { setFieldError('password', 'Password is required.'); hasError = true; }
      else if (rawData.password.length < 8) { setFieldError('password', 'Password must be at least 8 characters.'); hasError = true; }

      if (rawData.password !== rawData.confirmPassword) {
        setFieldError('confirmPassword', 'Passwords do not match.');
        hasError = true;
      }

      if (hasError) {
        showSubmitError('Please fix the highlighted errors before submitting your application.');
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Submitting parent application...';

      try {
        await AuthService.register(Object.assign(rawData, { role: 'PARENT' }));
        if (document.getElementById('marketingConsent')?.checked) {
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
          successBox.textContent = 'Parent application submitted successfully! Your account is pending administrator approval before you can sign in.';
          successBox.hidden = false;
        }
      } catch (error) {
        const errorMsg = error.message || 'Unable to submit parent application. Please check your inputs.';
        showSubmitError(errorMsg);
        
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach(err => {
            if (err.field && err.field !== 'root') setFieldError(err.field, err.message);
          });
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Parent Application';
      }
    });
  });
})();
