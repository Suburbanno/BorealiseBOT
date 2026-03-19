export function createPlaylistCalls(api) {
    return {
        getAll: () => api.playlist.getAll(),
        getById: (playlistId) => api.playlist.getById(playlistId),
        create: (name) => api.playlist.create(name),
        rename: (playlistId, name) => api.playlist.rename(playlistId, name),
        remove: (playlistId) => api.playlist.remove(playlistId),
        activate: (playlistId) => api.playlist.activate(playlistId),
        shuffle: (playlistId) => api.playlist.shuffle(playlistId),
        addItem: (playlistId, data) => api.playlist.addItem(playlistId, data),
        removeItem: (playlistId, itemId) => api.playlist.removeItem(playlistId, itemId),
        moveItem: (playlistId, itemId, position) => api.playlist.moveItem(playlistId, itemId, position),
        importPlaylist: (playlistId, data) => api.playlist.importPlaylist(playlistId, data),
    };
}
