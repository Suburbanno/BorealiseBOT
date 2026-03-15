export function pipelineConnect(client) {
  return client.connect();
}

export function pipelineDisconnect(client) {
  return client.disconnect();
}

export function pipelineIdentify(client, token) {
  return client.identify(token);
}

export function pipelineUpdatePresence(client, status, activity) {
  return client.updatePresence(status, activity);
}

export function pipelineSubscribe(client, events) {
  return client.subscribe(events);
}

export function pipelineUnsubscribe(client, events) {
  return client.unsubscribe(events);
}

export function pipelineSendChatMessage(client, roomSlug, content) {
  return client.sendChatMessage(roomSlug, content);
}

export function pipelineOn(client, event, listener) {
  return client.on(event, listener);
}

export function pipelineOff(client, event, listener) {
  return client.off(event, listener);
}

export function pipelineOnConnection(client, event, listener) {
  return client.onConnection(event, listener);
}

export function pipelineOffConnection(client, event, listener) {
  return client.offConnection(event, listener);
}
