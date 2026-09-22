/**
 * Shared frontend form validation helpers.
 * The backend (Zod) remains the authority; these are UX-layer checks.
 */
(function (global) {
  'use strict';

  const Validators = {
    required(value, label = 'This field') {
      if (value === undefined || value === null || String(value).trim() === '') {
        return `${label} is required.`;
      }
      return null;
    },
    email(value) {
      if (!value) return null;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value) ? null : 'Enter a valid email address.';
    },
    minLength(value, min, label = 'This field') {
      if (!value) return null;
      return String(value).length >= min ? null : `${label} must be at least ${min} characters.`;
    },
    maxLength(value, max, label = 'This field') {
      if (!value) return null;
      return String(value).length <= max ? null : `${label} must be at most ${max} characters.`;
    },
    phone(value) {
      if (!value) return null;
      const re = /^\+[1-9]\d{7,14}$/;
      return re.test(String(value).trim()) ? null : 'Use international format, for example +2348012345678.';
    },
    passwordStrength(value) {
      if (!value) return null;
      if (value.length < 8) return 'Password must be at least 8 characters.';
      return null;
    },
    passwordsMatch(value, confirm) {
      return value === confirm ? null : 'Passwords do not match.';
    },
    numeric(value, label = 'This field') {
      if (value === '' || value === null || value === undefined) return null;
      return !Number.isNaN(Number(value)) ? null : `${label} must be a number.`;
    },
    /**
     * Runs a set of {field, rules:[fn,...]} against a form-values object.
     * Each rule fn receives the field value and returns null | message.
     * Returns {valid, errors: {field: message}}
     */
    validateForm(values, schema) {
      const errors = {};
      Object.entries(schema).forEach(([field, rules]) => {
        for (const rule of rules) {
          const message = rule(values[field]);
          if (message) {
            errors[field] = message;
            break;
          }
        }
      });
      return { valid: Object.keys(errors).length === 0, errors };
    },
  };

  global.Validators = Validators;
})(window);
