export function getWorkspaceBroadcastChannelName(workspaceId) {
  return `textpad.workspace.${workspaceId}`;
}

export function createWorkspaceBroadcastChannel(workspaceId) {
  if (!workspaceId || typeof BroadcastChannel === "undefined") {
    return null;
  }

  return new BroadcastChannel(getWorkspaceBroadcastChannelName(workspaceId));
}

export function createWorkspaceBroadcastEvent(senderId, type, payload = {}) {
  return {
    senderId,
    type,
    payload,
    timestamp: Date.now(),
  };
}
