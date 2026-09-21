/**
 * Auth service — wraps all authentication-related API calls.
 */
(function (global) {
  'use strict';

  const { AUTH } = ENOCH_ENDPOINTS;

  const AuthService = {
    async register(data) {
      return ApiClient.post(AUTH.REGISTER, data);
    },

    /** @param {{email:string, password:string}} credentials */
    async login(credentials) {
      const payload = await ApiClient.post(AUTH.LOGIN, credentials);
      const data = ApiClient.unwrapItem(payload) || payload;

      const token = data.accessToken || data.token || (data.tokens && data.tokens.access);
      const refreshToken = data.refreshToken || (data.tokens && data.tokens.refresh);
      const user = data.user || data.profile || null;

      if (!token || !user) {
        throw new ApiClient.ApiError('Unexpected login response from server.', 500, payload);
      }

      Storage.setToken(token);
      if (refreshToken) Storage.setRefreshToken(refreshToken);
      Storage.setUser(user);

      return user;
    },

    async logout() {
      try {
        await ApiClient.post(AUTH.LOGOUT, {});
      } catch (e) {
        // Even if backend logout fails (e.g. token already expired),
        // we still clear the local session below.
      } finally {
        Storage.clearSession();
      }
    },

    async fetchCurrentUser() {
      const payload = await ApiClient.get(AUTH.ME);
      const user = payload && payload.data && payload.data.user
        ? payload.data.user
        : ApiClient.unwrapItem(payload);
      if (user) Storage.setUser(user);
      return user;
    },

    async forgotPassword(identifier) {
      return ApiClient.post(AUTH.FORGOT_PASSWORD, { email: identifier });
    },

    async resetPassword({ token, newPassword }) {
      return ApiClient.post(AUTH.RESET_PASSWORD, {
        token,
        password: newPassword,
        confirmPassword: newPassword,
      });
    },

    async changePassword({ currentPassword, newPassword }) {
      return ApiClient.post(AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
    },

    getStoredUser() {
      return Storage.getUser();
    },

    isAuthenticated() {
      return Boolean(Storage.getToken());
    },
  };

  global.AuthService = AuthService;
})(window);
