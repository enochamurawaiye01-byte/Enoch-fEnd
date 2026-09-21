/**
 * ENOCH INTERNATIONAL COLLEGE ERP
 * Centralized API client.
 *
 * Every HTTP request in the application must go through this module.
 * It handles: base URL resolution, JWT attachment, JSON encoding/decoding,
 * timeouts, network errors, and predictable error objects for services
 * to consume.
 *
 * Usage:
 *   const data = await ApiClient.get('/students', { page: 1 });
 *   const created = await ApiClient.post('/students', payload);
 */
(function (global) {
  'use strict';

  const { API_BASE_URL, REQUEST_TIMEOUT } = ENOCH_CONFIG;

  /**
   * Normalized API error. Services and pages can rely on this shape.
   */
  class ApiError extends Error {
    constructor(message, status, payload) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.payload = payload || null;
    }
  }

  function buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) return '';
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => search.append(key, v));
      } else {
        search.append(key, value);
      }
    });
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  }

  /**
   * Extracts a human-readable message from a variety of backend
   * error response shapes without throwing if the shape is unexpected.
   */
  function extractErrorMessage(payload, fallback) {
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload;
    if (payload.message) return payload.message;
    if (payload.error && typeof payload.error === 'string') return payload.error;
    if (payload.error && payload.error.message) return payload.error.message;
    if (payload.error && Array.isArray(payload.error.details) && payload.error.details.length) {
      const first = payload.error.details[0];
      if (first && first.message) return `${first.field ? `${first.field}: ` : ''}${first.message}`;
    }
    if (Array.isArray(payload.errors) && payload.errors.length) {
      const first = payload.errors[0];
      if (typeof first === 'string') return first;
      if (first.message) return first.message;
    }
    return fallback;
  }

  async function request(method, path, { data, params, headers, isFormData, signalTimeoutMs } = {}) {
    const url = `${API_BASE_URL}${path}${buildQueryString(params)}`;

    const controller = new AbortController();
    const timeoutMs = signalTimeoutMs || REQUEST_TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const finalHeaders = Object.assign({}, headers);
    if (!isFormData) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const token = global.Storage ? global.Storage.getToken() : null;
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
      method,
      headers: finalHeaders,
      signal: controller.signal,
    };

    if (data !== undefined) {
      fetchOptions.body = isFormData ? data : JSON.stringify(data);
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('The request timed out. Please try again.', 0, null);
      }
      throw new ApiError('Network error — unable to reach the server. Check your connection.', 0, null);
    }
    clearTimeout(timeoutId);

    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch (e) {
        payload = null;
      }
    } else if (response.status !== 204) {
      try {
        payload = await response.text();
      } catch (e) {
        payload = null;
      }
    }

    if (response.status === 401) {
      // Session invalid/expired: clear it and force re-login, unless this
      // *was* the login request itself (handled by caller).
      const isAuthEndpoint = path.startsWith('/auth/login');
      if (!isAuthEndpoint) {
        global.Storage && global.Storage.clearSession();
        const message = extractErrorMessage(payload, 'Your session has expired. Please log in again.');
        const err = new ApiError(message, 401, payload);
        // Defer redirect so the caller can still inspect the error if needed
        setTimeout(() => {
          if (!location.pathname.endsWith('/login.html') && !location.pathname.endsWith('/index.html') && location.pathname !== '/') {
            const depth = location.pathname.split('/pages/')[1] ? '../../' : '';
            window.location.href = `${depth || './'}login.html?expired=1`;
          }
        }, 50);
        throw err;
      }
    }

    if (response.status === 403) {
      const message = extractErrorMessage(payload, 'You do not have permission to perform this action.');
      throw new ApiError(message, 403, payload);
    }

    if (response.status === 404) {
      const message = extractErrorMessage(payload, 'The requested resource was not found.');
      throw new ApiError(message, 404, payload);
    }

    if (response.status === 422) {
      const message = extractErrorMessage(payload, 'Some fields need your attention.');
      throw new ApiError(message, 422, payload);
    }

    if (response.status === 429) {
      throw new ApiError('Too many requests. Please wait a moment and try again.', 429, payload);
    }

    if (response.status >= 500) {
      throw new ApiError('A server error occurred. Please try again shortly.', response.status, payload);
    }

    if (!response.ok) {
      const message = extractErrorMessage(payload, `Request failed (${response.status}).`);
      throw new ApiError(message, response.status, payload);
    }

    return payload;
  }

  /**
   * Attempts to read a list + pagination info out of varying backend
   * response envelopes without hiding genuine errors.
   * Supports: {data:[...]}, {data:{data:[...],meta}}, {results:[...]}, {items:[...]}, [...]
   */
  function unwrapList(payload) {
    if (!payload) return { items: [], meta: null };
    if (Array.isArray(payload)) return { items: payload, meta: null };
    if (Array.isArray(payload.data)) return { items: payload.data, meta: payload.meta || payload.pagination || null };
    if (payload.data && Array.isArray(payload.data.data)) {
      return { items: payload.data.data, meta: payload.data.meta || payload.data.pagination || payload.meta || null };
    }
    if (Array.isArray(payload.results)) return { items: payload.results, meta: payload.meta || payload.pagination || null };
    if (Array.isArray(payload.items)) return { items: payload.items, meta: payload.meta || payload.pagination || null };
    return { items: [], meta: null };
  }

  /** Unwraps a single-object response out of common envelopes. */
  function unwrapItem(payload) {
    if (!payload) return null;
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
    if (payload.result && typeof payload.result === 'object') return payload.result;
    return payload;
  }

  const ApiClient = {
    ApiError,
    unwrapList,
    unwrapItem,
    get(path, params, opts) {
      return request('GET', path, Object.assign({ params }, opts));
    },
    post(path, data, opts) {
      return request('POST', path, Object.assign({ data }, opts));
    },
    put(path, data, opts) {
      return request('PUT', path, Object.assign({ data }, opts));
    },
    patch(path, data, opts) {
      return request('PATCH', path, Object.assign({ data }, opts));
    },
    delete(path, opts) {
      return request('DELETE', path, opts || {});
    },
    upload(path, formData, opts) {
      return request('POST', path, Object.assign({ data: formData, isFormData: true }, opts));
    },
  };

  global.ApiClient = ApiClient;
})(window);
