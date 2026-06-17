const RECENT_WORKSPACES_STORAGE_KEY = "textpad.recentWorkspaces";
const MAX_RECENT_WORKSPACES = 6;

function isRecentWorkspace(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.workspaceId === "string" &&
      value.workspaceId.trim().length >= 3
  );
}

function normalizeRecentWorkspace(entry = {}) {
  const workspaceId = entry.workspaceId?.trim() ?? "";
  if (workspaceId.length < 3) {
    return null;
  }

  return {
    workspaceId,
    workspaceName:
      typeof entry.workspaceName === "string" && entry.workspaceName.trim().length > 0
        ? entry.workspaceName.trim()
        : workspaceId,
    isPasswordProtected: Boolean(entry.isPasswordProtected),
    lastOpenedAt:
      typeof entry.lastOpenedAt === "string" && entry.lastOpenedAt
        ? entry.lastOpenedAt
        : new Date().toISOString(),
  };
}

export function readRecentWorkspaces() {
  try {
    const raw = localStorage.getItem(RECENT_WORKSPACES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isRecentWorkspace)
      .map((entry) => normalizeRecentWorkspace(entry))
      .filter(Boolean)
      .slice(0, MAX_RECENT_WORKSPACES);
  } catch {
    return [];
  }
}

export function writeRecentWorkspaces(entries) {
  try {
    localStorage.setItem(
      RECENT_WORKSPACES_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_RECENT_WORKSPACES))
    );
  } catch {
    // ignore storage errors
  }
}

export function upsertRecentWorkspace(entries, workspace) {
  const normalized = normalizeRecentWorkspace(workspace);
  if (!normalized) {
    return entries;
  }

  return [
    normalized,
    ...entries.filter((entry) => entry.workspaceId !== normalized.workspaceId),
  ].slice(0, MAX_RECENT_WORKSPACES);
}

export function removeRecentWorkspace(entries, workspaceId) {
  return entries.filter((entry) => entry.workspaceId !== workspaceId);
}

export function replaceRecentWorkspace(entries, previousWorkspaceId, nextWorkspace) {
  const withoutPrevious = removeRecentWorkspace(entries, previousWorkspaceId);
  return upsertRecentWorkspace(withoutPrevious, nextWorkspace);
}
