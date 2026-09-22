(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#register-form');
    const errorBox = qs('#register-error');
    const successBox = qs('#register-success');
    const submitButton = qs('#register-submit');
    const roleSelect = qs('#role');
    const teacherFields = qs('#teacher-fields');
    const parentFields = qs('#parent-fields');

    roleSelect.addEventListener('change', () => {
      const isTeacher = roleSelect.value === 'TEACHER';
      const isParent = roleSelect.value === 'PARENT';
      teacherFields.hidden = !isTeacher;
      parentFields.hidden = !isParent;
      teacherFields.querySelectorAll('input').forEach((input) => { input.required = isTeacher; });
      parentFields.querySelectorAll('input').forEach((input) => { input.required = isParent; });
      submitButton.textContent = isTeacher ? 'Submit teacher application' : isParent ? 'Submit parent application' : 'Submit student application';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      successBox.hidden = true;

      const data = Object.fromEntries(
        Array.from(new FormData(form).entries()).filter(([, value]) => String(value).trim() !== '')
      );
      const validation = Validators.validateForm(data, {
        firstName: [(value) => Validators.required(value, 'First name')],
        lastName: [(value) => Validators.required(value, 'Last name')],
        email: [(value) => Validators.required(value, 'Email'), (value) => Validators.email(value)],
        phoneNumber: [(value) => Validators.required(value, 'Phone number'), (value) => Validators.phone(value)],
        password: [(value) => Validators.required(value, 'Password'), (value) => Validators.passwordStrength(value)],
        confirmPassword: [(value) => Validators.passwordsMatch(data.password, value)],
        staffNumber: [(value) => data.role === 'TEACHER' ? Validators.required(value, 'Staff number') : null],
        childRegistrationNumber: [(value) => data.role === 'PARENT' ? Validators.required(value, 'Child registration number') : null],
      });

      if (!validation.valid) {
        errorBox.textContent = Object.values(validation.errors)[0];
        errorBox.hidden = false;
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = data.role === 'TEACHER' ? 'Submitting teacher application...' : 'Submitting student application...';
      try {
        await AuthService.register(data);
        form.hidden = true;
        successBox.textContent = 'Application submitted. An administrator must approve your account before you can sign in.';
        successBox.hidden = false;
      } catch (error) {
        errorBox.textContent = error.message || 'Unable to create your account.';
        errorBox.hidden = false;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = data.role === 'TEACHER' ? 'Submit teacher application' : 'Submit student application';
      }
    });
  });
})();
