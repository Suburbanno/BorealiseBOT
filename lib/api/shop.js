export function createShopCalls(api) {
  return {
    getAvatarCatalog: () => api.shop.getAvatarCatalog(),
    unlockAvatar: (avatarId) => api.shop.unlockAvatar(avatarId),
    equipAvatar: (avatarId) => api.shop.equipAvatar(avatarId),
  };
}
