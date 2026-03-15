export function createSourceCalls(api) {
  return {
    searchYouTube: (query, limit) => api.source.searchYouTube(query, limit),
    getYouTubeVideo: (videoId) => api.source.getYouTubeVideo(videoId),
    searchSoundCloud: (query, limit) =>
      api.source.searchSoundCloud(query, limit),
    getSoundCloudTrack: (trackId) => api.source.getSoundCloudTrack(trackId),
    resolveSoundCloudUrl: (url) => api.source.resolveSoundCloudUrl(url),
    searchAll: (query, limit) => api.source.searchAll(query, limit),
  };
}
