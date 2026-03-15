export function createFriendCalls(api) {
  return {
    list: () => api.friend.list(),
    getStatus: (targetUserId) => api.friend.getStatus(targetUserId),
    sendRequest: (targetUserId) => api.friend.sendRequest(targetUserId),
    acceptRequest: (friendshipId) => api.friend.acceptRequest(friendshipId),
    remove: (friendshipId) => api.friend.remove(friendshipId),
    block: (targetUserId) => api.friend.block(targetUserId),
    unblock: (targetUserId) => api.friend.unblock(targetUserId),
  };
}
