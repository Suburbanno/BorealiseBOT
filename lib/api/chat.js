export function createChatCalls(api) {
  return {
    sendMessage: (slug, data) => api.chat.sendMessage(slug, data),
    getMessages: (slug, before, limit) =>
      api.chat.getMessages(slug, before, limit),
    deleteMessage: (slug, messageId) => api.chat.deleteMessage(slug, messageId),
  };
}
