(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('parent-register-form');
    const errorBox = document.getElementById('parent-register-error');
    const successBox = document.getElementById('parent-register-success');
    const submitButton = document.getElementById('parent-register-submit');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      successBox.hidden = true;

      const data = Object.fromEntries(new FormData(form).entries());
      const validation = Validators.validateForm(data, {
        childRegistrationNumber: [(value) => Validators.required(value, 'Child registration number')],
        firstName: [(value) => Validators.required(value, 'First name')],
        lastName: [(value) => Validators.required(value, 'Last name')],
        relationship: [(value) => Validators.required(value, 'Relationship')],
        email: [(value) => Validators.required(value, 'Email'), (value) => Validators.email(value)],
          phoneNumber: [(value) => Validators.required(value, 'Phone number'), (value) => Validators.phone(value)],
        password: [(value) => Validators.required(value, 'Password'), (value) => Validators.passwordStrength(value)],
        confirmPassword: [(value) => Validators.passwordsMatch(data.password, value)],
      });

      if (!validation.valid) {
        errorBox.textContent = Object.values(validation.errors)[0];
        errorBox.hidden = false;
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Submitting application...';
      try {
        await AuthService.register(Object.assign(data, { role: 'PARENT' }));
        if (document.getElementById('marketingConsent')?.checked) {
          ApiClient.post('/klaviyo/subscribe', {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            consent: true,
          }).catch(() => {});
        }
        form.hidden = true;
        successBox.textContent = 'Parent application submitted successfully. An administrator must approve it before you can sign in.';
        successBox.hidden = false;
      } catch (error) {
        errorBox.textContent = error.message || 'Unable to submit the parent application.';
        errorBox.hidden = false;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit parent application';
      }
    });
  });
})();
