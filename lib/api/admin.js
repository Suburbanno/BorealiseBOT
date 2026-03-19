export function createAdminCalls(api) {
    return {
        listUsers: (params) => api.admin.listUsers(params),
        enableUser: (id) => api.admin.enableUser(id),
        disableUser: (id) => api.admin.disableUser(id),
        updateRole: (id, role) => api.admin.updateRole(id, role),
        broadcast: (message) => api.admin.broadcast(message),
        setMaintenance: (active, message, endsAt) => api.admin.setMaintenance(active, message, endsAt),
        getStats: () => api.admin.getStats(),
        addViolation: (userId, reason) => api.admin.addViolation(userId, reason),
        revokeViolation: (violationId) => api.admin.revokeViolation(violationId),
        getUserViolations: (userId) => api.admin.getUserViolations(userId),
    };
}
