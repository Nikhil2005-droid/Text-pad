import { useEffect, useState } from "react";

import {
  createCodeAPI,
  createNoteAPI,
  deleteCodeAPI,
  deleteNoteAPI,
  fetchWorkspaceAPI,
  updateCodeAPI,
  updateNoteAPI,
} from "../api";

export function useNotes(workspace, workspaceAccessToken) {
  const workspaceId = workspace?.workspaceId;

  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [toast, setToast] = useState(null);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [savedNoteTitle, setSavedNoteTitle] = useState("");
  const [savedNoteContent, setSavedNoteContent] = useState("");
  const [noteSaveStatus, setNoteSaveStatus] = useState("idle");
  const [lastNoteSavedAt, setLastNoteSavedAt] = useState(null);
  const [pinnedNoteIds, setPinnedNoteIds] = useState([]);

  // Codes state
  const [codes, setCodes] = useState([]);
  const [activeCodeId, setActiveCodeId] = useState(null);
  const [codeTitle, setCodeTitle] = useState("");
  const [codeText, setCodeText] = useState("");
  const [savedCodeTitle, setSavedCodeTitle] = useState("");
  const [savedCodeText, setSavedCodeText] = useState("");
  const [codeSaveStatus, setCodeSaveStatus] = useState("idle");
  const [lastCodeSavedAt, setLastCodeSavedAt] = useState(null);
  const [pinnedCodeIds, setPinnedCodeIds] = useState([]);

  const noteIsDirty =
    !!activeNoteId &&
    (noteTitle !== savedNoteTitle || noteContent !== savedNoteContent);
  const codeIsDirty =
    !!activeCodeId && (codeTitle !== savedCodeTitle || codeText !== savedCodeText);

  const dismissToast = () => setToast(null);

  const showToast = (message, tone = "info", actionLabel, onAction) => {
    setToast({
      id: Date.now(),
      message,
      tone,
      actionLabel,
      onAction: onAction
        ? async () => {
            await onAction();
            setToast(null);
          }
        : null,
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timeoutId = setTimeout(
      () => setToast(null),
      toast.actionLabel ? 5000 : 2200
    );
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const pinnedNotesKey = (id) => `pinnedNotes:${id}`;
  const pinnedCodesKey = (id) => `pinnedCodes:${id}`;

  const loadPinned = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const savePinned = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    savePinned(pinnedNotesKey(workspaceId), pinnedNoteIds);
  }, [workspaceId, pinnedNoteIds]);

  useEffect(() => {
    if (!workspaceId) return;
    savePinned(pinnedCodesKey(workspaceId), pinnedCodeIds);
  }, [workspaceId, pinnedCodeIds]);

  useEffect(() => {
    setPinnedNoteIds((prev) => prev.filter((id) => notes.some((n) => n._id === id)));
  }, [notes]);

  useEffect(() => {
    setPinnedCodeIds((prev) => prev.filter((id) => codes.some((c) => c._id === id)));
  }, [codes]);

  useEffect(() => {
    if (!workspaceId) {
      setIsLoadingWorkspace(false);
      setToast(null);

      setNotes([]);
      setActiveNoteId(null);
      setNoteTitle("");
      setNoteContent("");
      setSavedNoteTitle("");
      setSavedNoteContent("");
      setNoteSaveStatus("idle");
      setLastNoteSavedAt(null);
      setPinnedNoteIds([]);

      setCodes([]);
      setActiveCodeId(null);
      setCodeTitle("");
      setCodeText("");
      setSavedCodeTitle("");
      setSavedCodeText("");
      setCodeSaveStatus("idle");
      setLastCodeSavedAt(null);
      setPinnedCodeIds([]);
      return;
    }

    setIsLoadingWorkspace(true);
    setToast(null);
    setPinnedNoteIds(loadPinned(pinnedNotesKey(workspaceId)));
    setPinnedCodeIds(loadPinned(pinnedCodesKey(workspaceId)));

    let isActive = true;
    const loadWorkspace = async () => {
      try {
        const data = await fetchWorkspaceAPI(workspaceId, workspaceAccessToken);
        if (!isActive) return;

        const nextNotes = Array.isArray(data?.notes) ? data.notes : [];
        const nextCodes = Array.isArray(data?.codes) ? data.codes : [];

        setNotes(nextNotes);
        setCodes(nextCodes);

        if (nextNotes.length > 0) {
          const firstNote = nextNotes[0];
          setActiveNoteId(firstNote._id);
          setNoteTitle(firstNote.title);
          setNoteContent(firstNote.content);
          setSavedNoteTitle(firstNote.title);
          setSavedNoteContent(firstNote.content);
          setLastNoteSavedAt(firstNote.updatedAt ?? firstNote.createdAt ?? null);
        } else {
          setActiveNoteId(null);
          setNoteTitle("");
          setNoteContent("");
          setSavedNoteTitle("");
          setSavedNoteContent("");
          setLastNoteSavedAt(null);
        }

        // Codes default: none selected until user creates/selects one.
        setActiveCodeId(null);
        setCodeTitle("");
        setCodeText("");
        setSavedCodeTitle("");
        setSavedCodeText("");
        setLastCodeSavedAt(null);
      } catch {
        if (isActive) {
          setNotes([]);
          setCodes([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingWorkspace(false);
        }
      }
    };

    loadWorkspace();
    return () => {
      isActive = false;
    };
  }, [workspaceAccessToken, workspaceId]);

  // Notes helpers
  const setNoteTitleValue = (value) => {
    setNoteTitle(value);
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteContentValue = (value) => {
    setNoteContent(value);
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const persistNote = async (options = {}) => {
    const { silent = false } = options;
    if (!workspaceId || !activeNoteId) return false;

    setNoteSaveStatus("saving");
    try {
      const data = await updateNoteAPI(
        workspaceId,
        activeNoteId,
        {
          title: noteTitle,
          content: noteContent,
        },
        workspaceAccessToken
      );
      setNotes(data);

      const updated = data.find((n) => n._id === activeNoteId);
      if (updated) {
        setNoteTitle(updated.title);
        setNoteContent(updated.content);
        setSavedNoteTitle(updated.title);
        setSavedNoteContent(updated.content);
        setLastNoteSavedAt(updated.updatedAt ?? new Date().toISOString());
      } else {
        setSavedNoteTitle(noteTitle);
        setSavedNoteContent(noteContent);
        setLastNoteSavedAt(new Date().toISOString());
      }

      setNoteSaveStatus("saved");
      if (!silent) showToast("Saved note", "success");
      return true;
    } catch {
      setNoteSaveStatus("error");
      // Even when autosaving silently, surface failures so the user isn't confused.
      showToast("Note save failed", "error");
      return false;
    }
  };

  const saveNoteIfDirty = async (options = {}) => {
    if (!noteIsDirty) return true;
    return await persistNote(options);
  };

  const createNote = async () => {
    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    try {
      const data = await createNoteAPI(workspaceId, {}, workspaceAccessToken);
      setNotes(data);
      const created = data[data.length - 1];
      if (created) {
        setActiveNoteId(created._id);
        setNoteTitle(created.title);
        setNoteContent(created.content);
        setSavedNoteTitle(created.title);
        setSavedNoteContent(created.content);
        setLastNoteSavedAt(created.updatedAt ?? created.createdAt ?? null);
      }
      showToast("Note created", "success");
    } catch {
      showToast("Create note failed", "error");
    }
  };

  const selectNote = async (note) => {
    if (!note) return;
    if (note._id === activeNoteId) return;
    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    setActiveNoteId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setSavedNoteTitle(note.title);
    setSavedNoteContent(note.content);
    setNoteSaveStatus("idle");
    setLastNoteSavedAt(note.updatedAt ?? note.createdAt ?? null);
  };

  const saveNote = async () => {
    await persistNote();
  };

  const finishNote = async () => {
    const ok = await saveNoteIfDirty();
    if (!ok) return;
    setActiveNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setSavedNoteTitle("");
    setSavedNoteContent("");
    setLastNoteSavedAt(null);
  };

  const togglePinNote = (id) => {
    setPinnedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const restoreNotes = async (items) => {
    if (!items || items.length === 0) return;
    try {
      for (const item of items) {
        const data = await createNoteAPI(
          workspaceId,
          {
            title: item.note.title,
            content: item.note.content,
          },
          workspaceAccessToken
        );
        setNotes(data);
        const created = data[data.length - 1];
        if (created && item.wasPinned) {
          setPinnedNoteIds((prev) =>
            prev.includes(created._id) ? prev : [...prev, created._id]
          );
        }
      }
      showToast(items.length === 1 ? "Note restored" : "Notes restored", "success");
    } catch {
      showToast("Restore failed", "error");
    }
  };

  const renameNote = async (noteId, nextTitle) => {
    const note = notes.find((n) => n._id === noteId);
    if (!note) return;

    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    const contentValue = noteId === activeNoteId ? noteContent : note.content ?? "";
    try {
      const data = await updateNoteAPI(
        workspaceId,
        noteId,
        {
          title: nextTitle ?? "",
          content: contentValue,
        },
        workspaceAccessToken
      );
      setNotes(data);
      if (noteId === activeNoteId) {
        const updated = data.find((n) => n._id === noteId);
        if (updated) {
          setNoteTitle(updated.title);
          setNoteContent(updated.content);
          setSavedNoteTitle(updated.title);
          setSavedNoteContent(updated.content);
          setLastNoteSavedAt(updated.updatedAt ?? new Date().toISOString());
        }
      }
      showToast("Title updated", "success");
    } catch {
      showToast("Rename failed", "error");
    }
  };

  const deleteNotesFromState = (ids) => {
    const idSet = new Set(ids);
    setNotes((prev) => prev.filter((n) => !idSet.has(n._id)));
    setPinnedNoteIds((prev) => prev.filter((id) => !idSet.has(id)));
    if (idSet.has(activeNoteId)) {
      setActiveNoteId(null);
      setNoteTitle("");
      setNoteContent("");
      setSavedNoteTitle("");
      setSavedNoteContent("");
      setLastNoteSavedAt(null);
    }
  };

  const deleteNotes = async (noteIds) => {
    const uniqueIds = Array.from(new Set(noteIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    const notesToDelete = notes.filter((n) => uniqueIds.includes(n._id));
    const restoreItems = notesToDelete.map((note) => ({
      note,
      wasPinned: pinnedNoteIds.includes(note._id),
    }));

    try {
      for (const id of uniqueIds) {
        await deleteNoteAPI(workspaceId, id, workspaceAccessToken);
      }
      deleteNotesFromState(uniqueIds);

      const message =
        uniqueIds.length === 1 ? "Note deleted" : `${uniqueIds.length} notes deleted`;
      showToast(message, "success", "Undo", async () => {
        await restoreNotes(restoreItems);
      });
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const deleteNote = async (noteId) => {
    await deleteNotes([noteId]);
  };

  // Codes helpers
  const setCodeTitleValue = (value) => {
    setCodeTitle(value);
    if (codeSaveStatus !== "saving") {
      setCodeSaveStatus("idle");
    }
  };

  const setCodeTextValue = (value) => {
    setCodeText(value);
    if (codeSaveStatus !== "saving") {
      setCodeSaveStatus("idle");
    }
  };

  const persistCode = async (options = {}) => {
    const { silent = false } = options;
    if (!workspaceId || !activeCodeId) return false;

    setCodeSaveStatus("saving");
    try {
      const data = await updateCodeAPI(
        workspaceId,
        activeCodeId,
        {
          title: codeTitle,
          code: codeText,
        },
        workspaceAccessToken
      );
      setCodes(data);

      const updated = data.find((c) => c._id === activeCodeId);
      if (updated) {
        setCodeTitle(updated.title);
        setCodeText(updated.code);
        setSavedCodeTitle(updated.title);
        setSavedCodeText(updated.code);
        setLastCodeSavedAt(updated.updatedAt ?? new Date().toISOString());
      } else {
        setSavedCodeTitle(codeTitle);
        setSavedCodeText(codeText);
        setLastCodeSavedAt(new Date().toISOString());
      }

      setCodeSaveStatus("saved");
      if (!silent) showToast("Saved code", "success");
      return true;
    } catch {
      setCodeSaveStatus("error");
      // Even when autosaving silently, surface failures so the user isn't confused.
      showToast("Code save failed", "error");
      return false;
    }
  };

  const saveCodeIfDirty = async (options = {}) => {
    if (!codeIsDirty) return true;
    return await persistCode(options);
  };

  const createCode = async () => {
    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    try {
      const data = await createCodeAPI(workspaceId, {}, workspaceAccessToken);
      setCodes(data);
      const created = data[data.length - 1];
      if (created) {
        setActiveCodeId(created._id);
        setCodeTitle(created.title);
        setCodeText(created.code);
        setSavedCodeTitle(created.title);
        setSavedCodeText(created.code);
        setLastCodeSavedAt(created.updatedAt ?? created.createdAt ?? null);
      }
      showToast("Code created", "success");
    } catch {
      showToast("Create code failed", "error");
    }
  };

  const selectCode = async (entry) => {
    if (!entry) return;
    if (entry._id === activeCodeId) return;
    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    setActiveCodeId(entry._id);
    setCodeTitle(entry.title);
    setCodeText(entry.code);
    setSavedCodeTitle(entry.title);
    setSavedCodeText(entry.code);
    setCodeSaveStatus("idle");
    setLastCodeSavedAt(entry.updatedAt ?? entry.createdAt ?? null);
  };

  const saveCode = async () => {
    await persistCode();
  };

  const finishCode = async () => {
    const ok = await saveCodeIfDirty();
    if (!ok) return;
    setActiveCodeId(null);
    setCodeTitle("");
    setCodeText("");
    setSavedCodeTitle("");
    setSavedCodeText("");
    setLastCodeSavedAt(null);
  };

  const togglePinCode = (id) => {
    setPinnedCodeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const restoreCodes = async (items) => {
    if (!items || items.length === 0) return;
    try {
      for (const item of items) {
        const data = await createCodeAPI(
          workspaceId,
          {
            title: item.code.title,
            code: item.code.code,
          },
          workspaceAccessToken
        );
        setCodes(data);
        const created = data[data.length - 1];
        if (created && item.wasPinned) {
          setPinnedCodeIds((prev) =>
            prev.includes(created._id) ? prev : [...prev, created._id]
          );
        }
      }
      showToast(items.length === 1 ? "Code restored" : "Codes restored", "success");
    } catch {
      showToast("Restore failed", "error");
    }
  };

  const renameCode = async (codeId, nextTitle) => {
    const entry = codes.find((c) => c._id === codeId);
    if (!entry) return;

    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    const codeValue = codeId === activeCodeId ? codeText : entry.code ?? "";
    try {
      const data = await updateCodeAPI(
        workspaceId,
        codeId,
        {
          title: nextTitle ?? "",
          code: codeValue,
        },
        workspaceAccessToken
      );
      setCodes(data);
      if (codeId === activeCodeId) {
        const updated = data.find((c) => c._id === codeId);
        if (updated) {
          setCodeTitle(updated.title);
          setCodeText(updated.code);
          setSavedCodeTitle(updated.title);
          setSavedCodeText(updated.code);
          setLastCodeSavedAt(updated.updatedAt ?? new Date().toISOString());
        }
      }
      showToast("Title updated", "success");
    } catch {
      showToast("Rename failed", "error");
    }
  };

  const deleteCodesFromState = (ids) => {
    const idSet = new Set(ids);
    setCodes((prev) => prev.filter((c) => !idSet.has(c._id)));
    setPinnedCodeIds((prev) => prev.filter((id) => !idSet.has(id)));
    if (idSet.has(activeCodeId)) {
      setActiveCodeId(null);
      setCodeTitle("");
      setCodeText("");
      setSavedCodeTitle("");
      setSavedCodeText("");
      setLastCodeSavedAt(null);
    }
  };

  const deleteCodes = async (codeIds) => {
    const uniqueIds = Array.from(new Set(codeIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    const codesToDelete = codes.filter((c) => uniqueIds.includes(c._id));
    const restoreItems = codesToDelete.map((code) => ({
      code,
      wasPinned: pinnedCodeIds.includes(code._id),
    }));

    try {
      for (const id of uniqueIds) {
        await deleteCodeAPI(workspaceId, id, workspaceAccessToken);
      }
      deleteCodesFromState(uniqueIds);

      const message =
        uniqueIds.length === 1 ? "Code deleted" : `${uniqueIds.length} codes deleted`;
      showToast(message, "success", "Undo", async () => {
        await restoreCodes(restoreItems);
      });
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const deleteCode = async (codeId) => {
    await deleteCodes([codeId]);
  };

  const saveWorkspaceIfDirty = async (options = {}) => {
    const okNote = await saveNoteIfDirty(options);
    if (!okNote) return false;
    const okCode = await saveCodeIfDirty(options);
    if (!okCode) return false;
    return true;
  };

  const workspaceDisplayName =
    workspace?.workspaceName || workspace?.workspaceId || "";

  return {
    // workspace
    workspaceDisplayName,
    isLoadingWorkspace,
    toast,
    dismissToast,
    // notes
    notes,
    activeNoteId,
    noteTitle,
    noteContent,
    noteIsDirty,
    noteSaveStatus,
    lastNoteSavedAt,
    pinnedNoteIds,
    setNoteTitle: setNoteTitleValue,
    setNoteContent: setNoteContentValue,
    createNote,
    selectNote,
    saveNote,
    finishNote,
    saveNoteIfDirty,
    renameNote,
    togglePinNote,
    deleteNote,
    deleteNotes,
    // codes
    codes,
    activeCodeId,
    codeTitle,
    codeText,
    codeIsDirty,
    codeSaveStatus,
    lastCodeSavedAt,
    pinnedCodeIds,
    setCodeTitle: setCodeTitleValue,
    setCodeText: setCodeTextValue,
    createCode,
    selectCode,
    saveCode,
    finishCode,
    saveCodeIfDirty,
    renameCode,
    togglePinCode,
    deleteCode,
    deleteCodes,
    // combined helpers
    saveWorkspaceIfDirty,
  };
}
