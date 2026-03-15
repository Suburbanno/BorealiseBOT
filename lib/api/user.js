export function createUserCalls(api) {
  return {
    getById: (id) => api.user.getById(id),
    getByUsername: (username) => api.user.getByUsername(username),
    updateProfile: (data) => api.user.updateProfile(data),
    deleteAccount: () => api.user.deleteAccount(),
    updateRole: (id, role) => api.user.updateRole(id, role),
    disable: (id) => api.user.disable(id),
    getMyViolations: () => api.user.getMyViolations(),
  };
}
