export function onPipelineConnect(client, handler) {
  return client.onConnection("onConnect", handler);
}

export function onPipelineDisconnect(client, handler) {
  return client.onConnection("onDisconnect", handler);
}

export function onPipelineReconnect(client, handler) {
  return client.onConnection("onReconnect", handler);
}

export function onPipelineStateChange(client, handler) {
  return client.onConnection("onStateChange", handler);
}

export function onPipelineReady(client, handler) {
  return client.onConnection("onReady", handler);
}

export function onPipelineError(client, handler) {
  return client.onConnection("onError", handler);
}

export function onPipelineDispatch(client, handler) {
  return client.onConnection("onDispatch", handler);
}
