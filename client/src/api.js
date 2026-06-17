const API = (import.meta.env.VITE_API_URL || "/api/workspaces").replace(/\/$/, "");
const TRANSLITERATION_API = (
  import.meta.env.VITE_TRANSLITERATION_API_URL || "/api/transliteration"
).replace(/\/$/, "");

function withWorkspaceToken(headers = {}, accessToken) {
  if (!accessToken) return headers;
  return {
    ...headers,
    "x-workspace-token": accessToken,
  };
}

async function parseApiResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || fallbackMessage);
    error.requiresPassword = Boolean(data?.requiresPassword);
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export const openWorkspaceAPI = (workspaceId, password = "") =>
  fetch(`${API}/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, password }),
  }).then((res) => parseApiResponse(res, "Failed to open workspace"));

export const fetchWorkspaceAPI = (workspaceId, accessToken) =>
  fetch(`${API}/${workspaceId}`, {
    headers: withWorkspaceToken({}, accessToken),
  }).then((res) => parseApiResponse(res, "Failed to fetch workspace"));

export const updateWorkspaceAPI = (workspaceId, patch, accessToken) =>
  fetch(`${API}/${workspaceId}`, {
    method: "PATCH",
    headers: withWorkspaceToken(
      { "Content-Type": "application/json" },
      accessToken
    ),
    body: JSON.stringify(patch),
  }).then((res) => parseApiResponse(res, "Failed to update workspace"));

export const createNoteAPI = (workspaceId, note = {}, accessToken) =>
  fetch(`${API}/${workspaceId}/notes`, {
    method: "POST",
    headers: withWorkspaceToken(
      { "Content-Type": "application/json" },
      accessToken
    ),
    body: JSON.stringify({
      title: note.title ?? "New Note",
      content: note.content ?? "",
      contentHtml: note.contentHtml ?? "",
      noteLanguage: note.noteLanguage,
      noteFontStyle: note.noteFontStyle,
      noteColor: note.noteColor,
      noteTextSize: note.noteTextSize,
      noteRuledLines: note.noteRuledLines,
    }),
  }).then((res) => parseApiResponse(res, "Failed to create note"));

export const updateNoteAPI = (workspaceId, noteId, data, accessToken) =>
  fetch(`${API}/${workspaceId}/notes/${noteId}`, {
    method: "PATCH",
    headers: withWorkspaceToken(
      { "Content-Type": "application/json" },
      accessToken
    ),
    body: JSON.stringify(data),
  }).then((res) => parseApiResponse(res, "Failed to update note"));

export const deleteNoteAPI = (workspaceId, noteId, accessToken) =>
  fetch(`${API}/${workspaceId}/notes/${noteId}`, {
    method: "DELETE",
    headers: withWorkspaceToken({}, accessToken),
  }).then((res) => parseApiResponse(res, "Failed to delete note"));

export const createCodeAPI = (workspaceId, entry = {}, accessToken) =>
  fetch(`${API}/${workspaceId}/codes`, {
    method: "POST",
    headers: withWorkspaceToken(
      { "Content-Type": "application/json" },
      accessToken
    ),
    body: JSON.stringify({
      title: entry.title ?? "New Code",
      code: entry.code ?? "",
    }),
  }).then((res) => parseApiResponse(res, "Failed to create code"));

export const updateCodeAPI = (workspaceId, codeId, data, accessToken) =>
  fetch(`${API}/${workspaceId}/codes/${codeId}`, {
    method: "PATCH",
    headers: withWorkspaceToken(
      { "Content-Type": "application/json" },
      accessToken
    ),
    body: JSON.stringify(data),
  }).then((res) => parseApiResponse(res, "Failed to update code"));

export const deleteCodeAPI = (workspaceId, codeId, accessToken) =>
  fetch(`${API}/${workspaceId}/codes/${codeId}`, {
    method: "DELETE",
    headers: withWorkspaceToken({}, accessToken),
  }).then((res) => parseApiResponse(res, "Failed to delete code"));

export const deleteWorkspaceAPI = (workspaceId, accessToken) =>
  fetch(`${API}/${workspaceId}`, {
    method: "DELETE",
    headers: withWorkspaceToken({}, accessToken),
  }).then((res) => parseApiResponse(res, "Failed to delete workspace"));

export const getTransliterationStatusAPI = () =>
  fetch(`${TRANSLITERATION_API}/status`).then((res) =>
    parseApiResponse(res, "Failed to read transliteration status")
  );

export const transliterateTextAPI = ({ text, language }) =>
  fetch(TRANSLITERATION_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  }).then((res) => parseApiResponse(res, "Failed to transliterate text"));
