export function createAuthCalls(api) {
  return {
    login: (credentials) => api.auth.login(credentials),
    register: (data) => api.auth.register(data),
    refresh: (refreshToken) => api.auth.refresh(refreshToken),
    logout: () => api.auth.logout(),
    me: () => api.auth.me(),
    forgotPassword: (email) => api.auth.forgotPassword(email),
    resetPassword: (token, password) => api.auth.resetPassword(token, password),
  };
}
