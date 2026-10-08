(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#register-form');
    const submitErrorBox = qs('#submit-error-box');
    const successBox = qs('#register-success');
    const submitButton = qs('#register-submit');
    const roleSelect = qs('#role');
    const studentFields = qs('#student-academic-fields');
    const teacherFields = qs('#teacher-fields');
    const parentFields = qs('#parent-fields');
    const currentClassSelect = qs('#currentClassId');
    const departmentGroup = qs('#department-group');
    const departmentSelect = qs('#desiredDepartmentId');
    const departmentRequirementByClassId = new Map();
    const passwordInput = qs('#password');
    const pwContainer = qs('#pw-strength-container');
    const pwBar = qs('#pw-strength-bar');
    const pwText = qs('#pw-strength-text');

    // Role-dependent fields toggle
    roleSelect.addEventListener('change', () => {
      const isTeacher = roleSelect.value === 'TEACHER';
      const isParent = roleSelect.value === 'PARENT';
      const isStudent = roleSelect.value === 'STUDENT';
      teacherFields.hidden = !isTeacher;
      parentFields.hidden = !isParent;
      studentFields.hidden = !isStudent;
      currentClassSelect.required = isStudent;
      const childRegistrationNumber = qs('#childRegistrationNumber');
      if (childRegistrationNumber) childRegistrationNumber.required = isParent;
      submitButton.textContent = isTeacher ? 'Submit Teacher Application' : isParent ? 'Submit Parent Application' : 'Submit Student Application';
    });
    roleSelect.dispatchEvent(new Event('change'));

    const updateDepartmentRequirement = () => {
      const requiresDepartment = departmentRequirementByClassId.get(currentClassSelect.value) === true;
      departmentGroup.hidden = !requiresDepartment;
      departmentSelect.required = requiresDepartment;
      if (!requiresDepartment) departmentSelect.value = '';
    };
    currentClassSelect.addEventListener('change', updateDepartmentRequirement);

    const loadRegistrationOptions = async () => {
      try {
        const payload = await AuthService.getRegistrationOptions();
        const options = payload.data || payload;
        currentClassSelect.innerHTML = '<option value="">Select Current Class</option>';
        (options.classes || []).forEach((schoolClass) => {
          departmentRequirementByClassId.set(schoolClass.id, schoolClass.requiresDepartment === true);
          const option = document.createElement('option');
          option.value = schoolClass.id;
          option.textContent = `${schoolClass.classLevel?.name || ''} ${schoolClass.arm || schoolClass.name}`.trim();
          currentClassSelect.appendChild(option);
        });
        (options.departments || []).forEach((department) => {
          const option = document.createElement('option');
          option.value = department.id;
          option.textContent = department.name;
          departmentSelect.appendChild(option);
        });
      } catch (error) {
        currentClassSelect.innerHTML = '<option value="">Classes unavailable</option>';
        const classError = qs('#error-currentClassId');
        if (classError) {
          classError.textContent = error.message || 'Unable to load classes and departments. Please refresh and try again.';
          classError.style.display = 'block';
        }
        currentClassSelect.disabled = true;
        departmentSelect.innerHTML = '<option value="">Departments unavailable</option>';
      }
    };
    loadRegistrationOptions();

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
        if (val.length >= 8) score += 20;
        if (/[a-z]/.test(val)) score += 20;
        if (/[A-Z]/.test(val)) score += 20;
        if (/[0-9]/.test(val)) score += 20;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(val)) score += 20;

        pwBar.style.width = score + '%';
        if (score <= 40) {
          pwBar.style.background = 'var(--color-brand-red)';
          pwText.style.color = 'var(--color-brand-red)';
          pwText.textContent = 'Weak';
        } else if (score <= 60) {
          pwBar.style.background = '#b9783c';
          pwText.style.color = '#b9783c';
          pwText.textContent = 'Fair';
        } else if (score <= 80) {
          pwBar.style.background = 'var(--color-deep-navy)';
          pwText.style.color = 'var(--color-deep-navy)';
          pwText.textContent = 'Good';
        } else {
          pwBar.style.background = 'var(--color-deep-navy)';
          pwText.style.color = 'var(--color-deep-navy)';
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
        errEl.style.color = 'var(--color-brand-red)';
        errEl.style.fontWeight = 'bold';
        errEl.style.fontSize = '12px';
        errEl.style.marginTop = '4px';
      }
      if (inputEl) {
        inputEl.classList.add('input-error');
        inputEl.style.borderColor = 'var(--color-brand-red)';
      }
    }

    function showSubmitError(msg) {
      if (submitErrorBox) {
        submitErrorBox.textContent = msg;
        submitErrorBox.hidden = false;
        submitErrorBox.style.color = 'var(--color-brand-red)';
        submitErrorBox.style.background = 'var(--color-danger-bg)';
        submitErrorBox.style.border = '1px solid rgba(163, 59, 69, 0.2)';
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

      if (rawData.role === 'STUDENT' && !rawData.currentClassId) {
        setFieldError('currentClassId', 'Select a class from the available classes.');
        hasError = true;
      }
      if (rawData.role === 'STUDENT' && departmentRequirementByClassId.get(rawData.currentClassId) === true && !rawData.desiredDepartmentId) {
        setFieldError('desiredDepartmentId', 'Select a department for this class.');
        hasError = true;
      }

      const passwordError = Validators.passwordStrength(rawData.password);
      if (!rawData.password) { setFieldError('password', 'Password is required.'); hasError = true; }
      else if (passwordError) { setFieldError('password', passwordError); hasError = true; }

      if (rawData.password !== rawData.confirmPassword) {
        setFieldError('confirmPassword', 'Passwords do not match.');
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
