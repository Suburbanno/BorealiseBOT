export function createRoomCalls(api) {
  return {
    list: () => api.room.list(),
    mine: (limit) => api.room.mine(limit),
    featured: () => api.room.featured(),
    getBySlug: (slug) => api.room.getBySlug(slug),
    create: (data) => api.room.create(data),
    updateRoom: (slug, data) => api.room.updateRoom(slug, data),
    deleteRoom: (slug) => api.room.deleteRoom(slug),
    getStaff: (slug) => api.room.getStaff(slug),
    getBans: (slug) => api.room.getBans(slug),
    getMutes: (slug) => api.room.getMutes(slug),
    updateUserRole: (slug, userId, role) =>
      api.room.updateUserRole(slug, userId, role),
    ban: (slug, userId, data) => api.room.ban(slug, userId, data),
    unban: (slug, userId) => api.room.unban(slug, userId),
    mute: (slug, userId, data) => api.room.mute(slug, userId, data),
    unmute: (slug, userId) => api.room.unmute(slug, userId),
    kick: (slug, userId) => api.room.kick(slug, userId),
    join: (slug) => api.room.join(slug),
    leave: (slug) => api.room.leave(slug),
    getWaitlist: (slug) => api.room.getWaitlist(slug),
    joinWaitlist: (slug) => api.room.joinWaitlist(slug),
    leaveWaitlist: (slug) => api.room.leaveWaitlist(slug),
    moveInWaitlist: (slug, userId, position) =>
      api.room.moveInWaitlist(slug, userId, position),
    removeFromWaitlist: (slug, userId) =>
      api.room.removeFromWaitlist(slug, userId),
    lockWaitlist: (slug) => api.room.lockWaitlist(slug),
    unlockWaitlist: (slug) => api.room.unlockWaitlist(slug),
    getBooth: (slug) => api.room.getBooth(slug),
    skipTrack: (slug, options) => api.room.skipTrack(slug, options),
    vote: (slug, type) => api.room.vote(slug, type),
    grabTrack: (slug, playlistId) => api.room.grabTrack(slug, playlistId),
    getHistory: (slug, page, limit) => api.room.getHistory(slug, page, limit),
    getAuditLog: (slug, limit, before) =>
      api.room.getAuditLog(slug, limit, before),
    activity: (limit) => api.room.activity(limit),
  };
}
