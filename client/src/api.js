const API = "http://localhost:5000/api/workspaces";

export const openWorkspaceAPI = (workspaceId) =>
  fetch(`${API}/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId }),
  }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to open workspace");
    }
    return data;
  });

export const fetchWorkspaceAPI = (workspaceId) =>
  fetch(`${API}/${workspaceId}`).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch workspace");
    }
    return data;
  });

export const updateWorkspaceAPI = (workspaceId, patch) =>
  fetch(`${API}/${workspaceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to update workspace");
    }
    return data;
  });

export const createNoteAPI = (workspaceId, note = {}) =>
  fetch(`${API}/${workspaceId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: note.title ?? "New Note",
      content: note.content ?? "",
    }),
  }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to create note");
    }
    return data;
  });

export const updateNoteAPI = (workspaceId, noteId, data) =>
  fetch(`${API}/${workspaceId}/notes/${noteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(async (res) => {
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.message || "Failed to update note");
    }
    return payload;
  });

export const deleteNoteAPI = (workspaceId, noteId) =>
  fetch(`${API}/${workspaceId}/notes/${noteId}`, {
    method: "DELETE",
  }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to delete note");
    }
    return data;
  });

export const createCodeAPI = (workspaceId, entry = {}) =>
  fetch(`${API}/${workspaceId}/codes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: entry.title ?? "New Code",
      code: entry.code ?? "",
    }),
  }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to create code");
    }
    return data;
  });

export const updateCodeAPI = (workspaceId, codeId, data) =>
  fetch(`${API}/${workspaceId}/codes/${codeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(async (res) => {
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.message || "Failed to update code");
    }
    return payload;
  });

export const deleteCodeAPI = (workspaceId, codeId) =>
  fetch(`${API}/${workspaceId}/codes/${codeId}`, {
    method: "DELETE",
  }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to delete code");
    }
    return data;
  });

export const deleteWorkspaceAPI = (workspaceId) =>
  fetch(`${API}/${workspaceId}`, { method: "DELETE" });
