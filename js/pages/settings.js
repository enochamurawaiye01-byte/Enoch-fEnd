/**
 * Settings — profile info, password change, notification preferences for
 * everyone; school-wide settings only for roles with 'users' access
 * (SUPER_ADMIN/ADMIN), matching backend authorization expectations.
 */
(function () {
  'use strict';

  async function loadProfile() {
    const form = document.getElementById('profile-form');
    try {
      const profile = await SettingsService.getProfile();
      if (profile) {
        form.querySelector('[name="firstName"]').value = profile.firstName || '';
        form.querySelector('[name="lastName"]').value = profile.lastName || '';
        form.querySelector('[name="email"]').value = profile.email || '';
        form.querySelector('[name="phone"]').value = profile.phone || '';
      }
    } catch (e) { /* non-fatal, form stays editable with blanks */ }
  }

  function bindProfileForm() {
    const form = document.getElementById('profile-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const btn = document.getElementById('profile-save-btn');
      Loader.setButtonLoading(btn, true, 'Saving…');
      try {
        await SettingsService.updateProfile(values);
        Toast.success('Profile updated.');
      } catch (err) {
        Toast.error(err.message || 'Unable to update your profile.');
      } finally {
        Loader.setButtonLoading(btn, false);
      }
    });
  }

  function bindPasswordForm() {
    const form = document.getElementById('password-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const { valid, errors } = Validators.validateForm(values, {
        currentPassword: [(v) => Validators.required(v, 'Current password')],
        newPassword: [(v) => Validators.required(v, 'New password'), (v) => Validators.passwordStrength(v)],
        confirmPassword: [(v) => Validators.passwordsMatch(values.newPassword, v)],
      });
      form.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));
      if (!valid) {
        Object.entries(errors).forEach(([field, message]) => {
          const input = form.querySelector(`[name="${field}"]`);
          const group = input && input.closest('.form-group');
          if (group) { group.classList.add('has-error'); group.querySelector('.form-error').textContent = message; }
        });
        return;
      }
      const btn = document.getElementById('password-save-btn');
      Loader.setButtonLoading(btn, true, 'Updating…');
      try {
        await AuthService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
        Toast.success('Password updated successfully.');
        form.reset();
      } catch (err) {
        Toast.error(err.message || 'Unable to update your password.');
      } finally {
        Loader.setButtonLoading(btn, false);
      }
    });
  }

  function bindPreferencesForm() {
    const form = document.getElementById('preferences-form');
    if (!form) return;
    SettingsService.getPreferences()
      .then((prefs) => {
        if (!prefs) return;
        Object.entries(prefs).forEach(([key, value]) => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input && input.type === 'checkbox') input.checked = Boolean(value);
        });
      })
      .catch(() => { /* non-fatal */ });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const values = {};
      form.querySelectorAll('input[type="checkbox"]').forEach((cb) => { values[cb.name] = cb.checked; });
      const btn = document.getElementById('preferences-save-btn');
      Loader.setButtonLoading(btn, true, 'Saving…');
      try {
        await SettingsService.updatePreferences(values);
        Toast.success('Preferences updated.');
      } catch (err) {
        Toast.error(err.message || 'Unable to update preferences.');
      } finally {
        Loader.setButtonLoading(btn, false);
      }
    });
  }

  function bindSchoolForm() {
    const form = document.getElementById('school-form');
    if (!form) return;
    SettingsService.getSchool()
      .then((school) => {
        if (!school) return;
        ['name', 'address', 'phone', 'email', 'motto'].forEach((key) => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.value = school[key] || '';
        });
      })
      .catch(() => { /* non-fatal */ });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const btn = document.getElementById('school-save-btn');
      Loader.setButtonLoading(btn, true, 'Saving…');
      try {
        await SettingsService.updateSchool(values);
        Toast.success('School settings updated.');
      } catch (err) {
        Toast.error(err.message || 'Unable to update school settings.');
      } finally {
        Loader.setButtonLoading(btn, false);
      }
    });
  }

  function initTabs() {
    const tabs = qsa('.tab-btn');
    const panels = qsa('.tab-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => (p.hidden = true));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tabTarget).hidden = false;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    initTabs();

    const schoolTabBtn = document.querySelector('[data-tab-target="tab-school"]');
    const canManageSchool = Permissions.canAccessModule(window.CurrentUser.role, 'users');
    if (schoolTabBtn && !canManageSchool) schoolTabBtn.hidden = true;

    loadProfile();
    bindProfileForm();
    bindPasswordForm();
    bindPreferencesForm();
    if (canManageSchool) bindSchoolForm();
  });
})();
