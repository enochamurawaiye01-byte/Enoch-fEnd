/**
 * ENOCH INTERNATIONAL COLLEGE ERP
 * Centralized API configuration.
 *
 * This is the ONLY file where the backend host should ever be defined.
 * Every other file must import API_BASE_URL / API_PREFIX from here.
 *
 * To point the frontend at a different backend (staging, production, local),
 * change ONLY the value below.
 */

(function (global) {
  'use strict';

  // Local pages use the local API; hosted pages use the deployed API.
  const isLocalPage = window.location.protocol === 'file:'
    || window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1';
  const API_HOST = window.__ENOCH_API_HOST__
    || (isLocalPage ? 'http://localhost:10000' : 'https://enoch-international-college-b-end.onrender.com');

  const API_PREFIX = '/api';

  const API_BASE_URL = `${API_HOST}${API_PREFIX}`;

  // Request timeout (ms)
  const REQUEST_TIMEOUT = 30000;

  // Keys used in localStorage/sessionStorage - centralized so they never drift
  const STORAGE_KEYS = {
    ACCESS_TOKEN: 'enoch_access_token',
    REFRESH_TOKEN: 'enoch_refresh_token',
    USER: 'enoch_user',
    THEME: 'enoch_theme',
    SIDEBAR_COLLAPSED: 'enoch_sidebar_collapsed',
  };

  global.ENOCH_CONFIG = {
    API_HOST,
    API_PREFIX,
    API_BASE_URL,
    REQUEST_TIMEOUT,
    STORAGE_KEYS,
  };
})(window);
