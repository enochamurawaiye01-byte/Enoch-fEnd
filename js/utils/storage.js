/**
 * Storage utility - centralizes all localStorage access so token/user
 * persistence logic never has to be duplicated across the app.
 */
(function (global) {
  'use strict';

  const { STORAGE_KEYS } = ENOCH_CONFIG;

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage read failed', e);
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Storage write failed', e);
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage remove failed', e);
    }
  }

  const Storage = {
    getToken() {
      return safeGet(STORAGE_KEYS.ACCESS_TOKEN);
    },
    setToken(token) {
      return safeSet(STORAGE_KEYS.ACCESS_TOKEN, token);
    },
    clearToken() {
      safeRemove(STORAGE_KEYS.ACCESS_TOKEN);
    },

    getRefreshToken() {
      return safeGet(STORAGE_KEYS.REFRESH_TOKEN);
    },
    setRefreshToken(token) {
      return safeSet(STORAGE_KEYS.REFRESH_TOKEN, token);
    },
    clearRefreshToken() {
      safeRemove(STORAGE_KEYS.REFRESH_TOKEN);
    },

    getUser() {
      const raw = safeGet(STORAGE_KEYS.USER);
      if (!raw) return null;
      try {
        const user = JSON.parse(raw);
        // Recover sessions written by the previous /auth/me response shape.
        return user && user.user && user.user.role ? user.user : user;
      } catch (e) {
        return null;
      }
    },
    setUser(user) {
      return safeSet(STORAGE_KEYS.USER, JSON.stringify(user));
    },
    clearUser() {
      safeRemove(STORAGE_KEYS.USER);
    },

    getTheme() {
      return safeGet(STORAGE_KEYS.THEME) || 'light';
    },
    setTheme(theme) {
      return safeSet(STORAGE_KEYS.THEME, theme);
    },

    getSidebarCollapsed() {
      return safeGet(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    },
    setSidebarCollapsed(collapsed) {
      return safeSet(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
    },

    clearSession() {
      this.clearToken();
      this.clearRefreshToken();
      this.clearUser();
    },
  };

  global.Storage = Storage;
})(window);
