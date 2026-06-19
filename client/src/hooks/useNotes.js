import { useCallback, useEffect, useRef, useState } from "react";

import {
  createCodeAPI,
  createNoteAPI,
  deleteCodeAPI,
  deleteNoteAPI,
  fetchWorkspaceAPI,
  updateCodeAPI,
  updateNoteAPI,
} from "../api";
import {
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_FONT_STYLE,
  DEFAULT_NOTE_LANGUAGE,
  normalizeNoteColor,
} from "../languages/index.js";
import {
  DEFAULT_NOTE_RULED_LINES,
  DEFAULT_NOTE_TEXT_SIZE,
  extractPlainTextFromHtml,
  normalizeNoteHtml,
  plainTextToNoteHtml,
} from "../utils/noteStudio.js";
import {
  createWorkspaceBroadcastChannel,
  createWorkspaceBroadcastEvent,
} from "../utils/workspaceBroadcast.js";
import { reportError } from "../utils/errorTracking.js";

function getDefaultNoteRuledLines(workspaceOrValue) {
  if (typeof workspaceOrValue === "boolean") {
    return workspaceOrValue;
  }

  return workspaceOrValue?.preferences?.ruledNotes ?? DEFAULT_NOTE_RULED_LINES;
}

function getEntityRevision(entry) {
  return Number.isInteger(entry?.revision) ? entry.revision : 0;
}

function getSavedAtLabel(entry) {
  return entry?.updatedAt ?? entry?.createdAt ?? null;
}

function replaceItemById(items, nextItem) {
  const nextId = nextItem?._id;
  if (!nextId) return items;

  const exists = items.some((item) => item._id === nextId);
  if (!exists) {
    return [...items, nextItem];
  }

  return items.map((item) => (item._id === nextId ? nextItem : item));
}

function getNoteDraft(note = {}, defaultNoteRuledLines = DEFAULT_NOTE_RULED_LINES) {
  const fallbackContent = note.content ?? "";
  const contentHtml = normalizeNoteHtml(note.contentHtml, fallbackContent);
  const content = extractPlainTextFromHtml(contentHtml) || fallbackContent;

  return {
    title: note.title ?? "",
    content,
    contentHtml,
    noteLanguage: note.noteLanguage ?? DEFAULT_NOTE_LANGUAGE,
    noteFontStyle: note.noteFontStyle ?? DEFAULT_NOTE_FONT_STYLE,
    noteColor: normalizeNoteColor(note.noteColor ?? DEFAULT_NOTE_COLOR),
    noteTextSize: note.noteTextSize ?? DEFAULT_NOTE_TEXT_SIZE,
    noteRuledLines:
      typeof note.noteRuledLines === "boolean"
        ? note.noteRuledLines
        : getDefaultNoteRuledLines(defaultNoteRuledLines),
  };
}

function getNotePayload({
  title,
  content,
  contentHtml,
  noteLanguage,
  noteFontStyle,
  noteColor,
  noteTextSize,
  noteRuledLines,
}) {
  const normalizedContentHtml = normalizeNoteHtml(
    contentHtml,
    typeof content === "string" ? content : ""
  );
  const plainTextContent =
    typeof content === "string" && content.length > 0
      ? content
      : extractPlainTextFromHtml(normalizedContentHtml);

  return {
    title,
    content: plainTextContent,
    contentHtml: normalizedContentHtml,
    noteLanguage: noteLanguage ?? DEFAULT_NOTE_LANGUAGE,
    noteFontStyle: noteFontStyle ?? DEFAULT_NOTE_FONT_STYLE,
    noteColor: normalizeNoteColor(noteColor ?? DEFAULT_NOTE_COLOR),
    noteTextSize: noteTextSize ?? DEFAULT_NOTE_TEXT_SIZE,
    noteRuledLines:
      typeof noteRuledLines === "boolean"
        ? noteRuledLines
        : DEFAULT_NOTE_RULED_LINES,
  };
}

function getCodeDraft(entry = {}) {
  return {
    title: entry.title ?? "",
    code: entry.code ?? "",
  };
}

function getCodePayload({ title, code }) {
  return {
    title: title ?? "",
    code: code ?? "",
  };
}

export function useNotes(workspace, workspaceAccessToken) {
  const workspaceId = workspace?.workspaceId;
  const defaultNoteRuledLines = getDefaultNoteRuledLines(workspace);

  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState("");
  const [toast, setToast] = useState(null);

  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteContentHtml, setNoteContentHtml] = useState(plainTextToNoteHtml(""));
  const [noteLanguage, setNoteLanguage] = useState(DEFAULT_NOTE_LANGUAGE);
  const [noteFontStyle, setNoteFontStyle] = useState(DEFAULT_NOTE_FONT_STYLE);
  const [noteColor, setNoteColor] = useState(DEFAULT_NOTE_COLOR);
  const [noteTextSize, setNoteTextSize] = useState(DEFAULT_NOTE_TEXT_SIZE);
  const [noteRuledLines, setNoteRuledLines] = useState(
    getDefaultNoteRuledLines(workspace)
  );
  const [noteRevision, setNoteRevision] = useState(0);
  const [savedNoteTitle, setSavedNoteTitle] = useState("");
  const [savedNoteContent, setSavedNoteContent] = useState("");
  const [savedNoteContentHtml, setSavedNoteContentHtml] = useState(
    plainTextToNoteHtml("")
  );
  const [savedNoteLanguage, setSavedNoteLanguage] = useState(DEFAULT_NOTE_LANGUAGE);
  const [savedNoteFontStyle, setSavedNoteFontStyle] = useState(
    DEFAULT_NOTE_FONT_STYLE
  );
  const [savedNoteColor, setSavedNoteColor] = useState(DEFAULT_NOTE_COLOR);
  const [savedNoteTextSize, setSavedNoteTextSize] = useState(
    DEFAULT_NOTE_TEXT_SIZE
  );
  const [savedNoteRuledLines, setSavedNoteRuledLines] = useState(
    getDefaultNoteRuledLines(workspace)
  );
  const [noteSaveStatus, setNoteSaveStatus] = useState("idle");
  const [lastNoteSavedAt, setLastNoteSavedAt] = useState(null);
  const [pinnedNoteIds, setPinnedNoteIds] = useState([]);

  const [codes, setCodes] = useState([]);
  const [activeCodeId, setActiveCodeId] = useState(null);
  const [codeTitle, setCodeTitle] = useState("");
  const [codeText, setCodeText] = useState("");
  const [codeRevision, setCodeRevision] = useState(0);
  const [savedCodeTitle, setSavedCodeTitle] = useState("");
  const [savedCodeText, setSavedCodeText] = useState("");
  const [codeSaveStatus, setCodeSaveStatus] = useState("idle");
  const [lastCodeSavedAt, setLastCodeSavedAt] = useState(null);
  const [pinnedCodeIds, setPinnedCodeIds] = useState([]);

  const latestStateRef = useRef({});
  const broadcastChannelRef = useRef(null);
  const broadcastSenderIdRef = useRef(
    `textpad-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  const noteConflictKeyRef = useRef("");
  const codeConflictKeyRef = useRef("");

  const noteIsDirty =
    !!activeNoteId &&
    (noteTitle !== savedNoteTitle ||
      noteContent !== savedNoteContent ||
      noteContentHtml !== savedNoteContentHtml ||
      noteLanguage !== savedNoteLanguage ||
      noteFontStyle !== savedNoteFontStyle ||
      normalizeNoteColor(noteColor) !== normalizeNoteColor(savedNoteColor) ||
      noteTextSize !== savedNoteTextSize ||
      noteRuledLines !== savedNoteRuledLines);
  const codeIsDirty =
    !!activeCodeId && (codeTitle !== savedCodeTitle || codeText !== savedCodeText);

  useEffect(() => {
    latestStateRef.current = {
      notes,
      codes,
      activeNoteId,
      activeCodeId,
      noteIsDirty,
      codeIsDirty,
      noteRevision,
      codeRevision,
      noteTitle,
      noteContent,
      noteContentHtml,
      noteLanguage,
      noteFontStyle,
      noteColor,
      noteTextSize,
      noteRuledLines,
      codeTitle,
      codeText,
    };
  }, [
    activeCodeId,
    activeNoteId,
    codeIsDirty,
    codeRevision,
    codeText,
    codeTitle,
    codes,
    noteColor,
    noteContent,
    noteContentHtml,
    noteFontStyle,
    noteIsDirty,
    noteLanguage,
    noteRevision,
    noteRuledLines,
    noteTextSize,
    noteTitle,
    notes,
  ]);

  const dismissToast = () => setToast(null);

  const showToast = useCallback(
    (message, tone = "info", actionLabel, onAction) => {
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
    },
    []
  );

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = setTimeout(
      () => setToast(null),
      toast.actionLabel ? 5000 : 2200
    );
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const applyDraftToActiveNote = useCallback(
    (draft, savedAt = null, options = {}) => {
      const { markSaved = true, revision = 0 } = options;

      setNoteTitle(draft.title);
      setNoteContent(draft.content);
      setNoteContentHtml(draft.contentHtml);
      setNoteLanguage(draft.noteLanguage);
      setNoteFontStyle(draft.noteFontStyle);
      setNoteColor(draft.noteColor);
      setNoteTextSize(draft.noteTextSize);
      setNoteRuledLines(draft.noteRuledLines);
      setNoteRevision(revision);
      setLastNoteSavedAt(savedAt);
      noteConflictKeyRef.current = "";

      if (!markSaved) {
        return;
      }

      setSavedNoteTitle(draft.title);
      setSavedNoteContent(draft.content);
      setSavedNoteContentHtml(draft.contentHtml);
      setSavedNoteLanguage(draft.noteLanguage);
      setSavedNoteFontStyle(draft.noteFontStyle);
      setSavedNoteColor(draft.noteColor);
      setSavedNoteTextSize(draft.noteTextSize);
      setSavedNoteRuledLines(draft.noteRuledLines);
    },
    []
  );

  const clearActiveNoteDraft = useCallback(() => {
    const emptyHtml = plainTextToNoteHtml("");
    setActiveNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteContentHtml(emptyHtml);
    setNoteLanguage(DEFAULT_NOTE_LANGUAGE);
    setNoteFontStyle(DEFAULT_NOTE_FONT_STYLE);
    setNoteColor(DEFAULT_NOTE_COLOR);
    setNoteTextSize(DEFAULT_NOTE_TEXT_SIZE);
    setNoteRuledLines(defaultNoteRuledLines);
    setNoteRevision(0);
    setSavedNoteTitle("");
    setSavedNoteContent("");
    setSavedNoteContentHtml(emptyHtml);
    setSavedNoteLanguage(DEFAULT_NOTE_LANGUAGE);
    setSavedNoteFontStyle(DEFAULT_NOTE_FONT_STYLE);
    setSavedNoteColor(DEFAULT_NOTE_COLOR);
    setSavedNoteTextSize(DEFAULT_NOTE_TEXT_SIZE);
    setSavedNoteRuledLines(defaultNoteRuledLines);
    setLastNoteSavedAt(null);
    noteConflictKeyRef.current = "";
  }, [defaultNoteRuledLines]);

  const applyDraftToActiveCode = useCallback(
    (draft, savedAt = null, options = {}) => {
      const { markSaved = true, revision = 0 } = options;

      setCodeTitle(draft.title);
      setCodeText(draft.code);
      setCodeRevision(revision);
      setLastCodeSavedAt(savedAt);
      codeConflictKeyRef.current = "";

      if (!markSaved) {
        return;
      }

      setSavedCodeTitle(draft.title);
      setSavedCodeText(draft.code);
    },
    []
  );

  const clearActiveCodeDraft = useCallback(() => {
    setActiveCodeId(null);
    setCodeTitle("");
    setCodeText("");
    setCodeRevision(0);
    setSavedCodeTitle("");
    setSavedCodeText("");
    setLastCodeSavedAt(null);
    codeConflictKeyRef.current = "";
  }, []);

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
    setPinnedNoteIds((prev) => prev.filter((id) => notes.some((note) => note._id === id)));
  }, [notes]);

  useEffect(() => {
    setPinnedCodeIds((prev) => prev.filter((id) => codes.some((entry) => entry._id === id)));
  }, [codes]);

  const broadcastWorkspaceMutation = useCallback((type, payload = {}) => {
    broadcastChannelRef.current?.postMessage(
      createWorkspaceBroadcastEvent(
        broadcastSenderIdRef.current,
        type,
        payload
      )
    );
  }, []);

  const syncWorkspaceSnapshot = useCallback(
    (data, options = {}) => {
      const { preserveSelection = false, origin = "load" } = options;
      const nextNotes = Array.isArray(data?.notes) ? data.notes : [];
      const nextCodes = Array.isArray(data?.codes) ? data.codes : [];
      const {
        activeNoteId: currentActiveNoteId,
        activeCodeId: currentActiveCodeId,
        noteIsDirty: currentNoteIsDirty,
        codeIsDirty: currentCodeIsDirty,
        noteRevision: currentNoteRevision,
        codeRevision: currentCodeRevision,
      } = latestStateRef.current;

      setNotes(nextNotes);
      setCodes(nextCodes);

      if (!preserveSelection) {
        if (nextNotes.length > 0) {
          const firstNote = nextNotes[0];
          setActiveNoteId(firstNote._id);
          applyDraftToActiveNote(
            getNoteDraft(firstNote, defaultNoteRuledLines),
            getSavedAtLabel(firstNote),
            { revision: getEntityRevision(firstNote) }
          );
          setNoteSaveStatus("idle");
        } else {
          clearActiveNoteDraft();
          setNoteSaveStatus("idle");
        }

        clearActiveCodeDraft();
        setCodeSaveStatus("idle");
        return;
      }

      const nextActiveNote = currentActiveNoteId
        ? nextNotes.find((note) => note._id === currentActiveNoteId)
        : null;

      if (!nextActiveNote) {
        if (currentActiveNoteId) {
          clearActiveNoteDraft();
          setNoteSaveStatus("idle");
          if (origin === "broadcast") {
            showToast("A note was removed in another tab", "error");
          }
        }
      } else if (!currentNoteIsDirty) {
        setActiveNoteId(nextActiveNote._id);
        applyDraftToActiveNote(
          getNoteDraft(nextActiveNote, defaultNoteRuledLines),
          getSavedAtLabel(nextActiveNote),
          { revision: getEntityRevision(nextActiveNote) }
        );
        setNoteSaveStatus("idle");
      } else if (
        origin === "broadcast" &&
        getEntityRevision(nextActiveNote) !== currentNoteRevision
      ) {
        const conflictKey = `${nextActiveNote._id}:${getEntityRevision(nextActiveNote)}`;
        if (noteConflictKeyRef.current !== conflictKey) {
          noteConflictKeyRef.current = conflictKey;
          showToast("A newer version of this note is available in another tab");
        }
      }

      const nextActiveCode = currentActiveCodeId
        ? nextCodes.find((entry) => entry._id === currentActiveCodeId)
        : null;

      if (!nextActiveCode) {
        if (currentActiveCodeId) {
          clearActiveCodeDraft();
          setCodeSaveStatus("idle");
          if (origin === "broadcast") {
            showToast("A code entry was removed in another tab", "error");
          }
        }
      } else if (!currentCodeIsDirty) {
        setActiveCodeId(nextActiveCode._id);
        applyDraftToActiveCode(
          getCodeDraft(nextActiveCode),
          getSavedAtLabel(nextActiveCode),
          { revision: getEntityRevision(nextActiveCode) }
        );
        setCodeSaveStatus("idle");
      } else if (
        origin === "broadcast" &&
        getEntityRevision(nextActiveCode) !== currentCodeRevision
      ) {
        const conflictKey = `${nextActiveCode._id}:${getEntityRevision(nextActiveCode)}`;
        if (codeConflictKeyRef.current !== conflictKey) {
          codeConflictKeyRef.current = conflictKey;
          showToast("A newer version of this code entry is available in another tab");
        }
      }
    },
    [
      applyDraftToActiveCode,
      applyDraftToActiveNote,
      clearActiveCodeDraft,
      clearActiveNoteDraft,
      defaultNoteRuledLines,
      showToast,
    ]
  );

  const refreshWorkspaceFromServer = useCallback(
    async (options = {}) => {
      if (!workspaceId) return null;

      const data = await fetchWorkspaceAPI(workspaceId, workspaceAccessToken);
      syncWorkspaceSnapshot(data, options);
      return data;
    },
    [syncWorkspaceSnapshot, workspaceAccessToken, workspaceId]
  );

  useEffect(() => {
    if (!workspaceId) {
      setIsLoadingWorkspace(false);
      setWorkspaceLoadError("");
      setToast(null);
      setNotes([]);
      clearActiveNoteDraft();
      setNoteSaveStatus("idle");
      setPinnedNoteIds([]);
      setCodes([]);
      clearActiveCodeDraft();
      setCodeSaveStatus("idle");
      setPinnedCodeIds([]);
      return;
    }

    setIsLoadingWorkspace(true);
    setWorkspaceLoadError("");
    setToast(null);
    setPinnedNoteIds(loadPinned(pinnedNotesKey(workspaceId)));
    setPinnedCodeIds(loadPinned(pinnedCodesKey(workspaceId)));

    let isActive = true;

    refreshWorkspaceFromServer()
      .catch((error) => {
        if (!isActive) return;
        setWorkspaceLoadError(error?.message || "Unable to load this workspace.");
        void reportError(error, {
          source: "workspace.load",
          workspaceId,
        });
        setNotes([]);
        setCodes([]);
        clearActiveNoteDraft();
        clearActiveCodeDraft();
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingWorkspace(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [clearActiveCodeDraft, clearActiveNoteDraft, refreshWorkspaceFromServer, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return undefined;

    const channel = createWorkspaceBroadcastChannel(workspaceId);
    broadcastChannelRef.current = channel;
    if (!channel) return undefined;

    const handleMessage = (event) => {
      const incoming = event?.data;
      if (!incoming || incoming.senderId === broadcastSenderIdRef.current) {
        return;
      }

      void refreshWorkspaceFromServer({
        preserveSelection: true,
        origin: "broadcast",
      }).catch(() => {
        // Ignore background sync failures and keep the current draft visible.
      });
    };

    channel.addEventListener("message", handleMessage);
    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      if (broadcastChannelRef.current === channel) {
        broadcastChannelRef.current = null;
      }
    };
  }, [refreshWorkspaceFromServer, workspaceId]);

  const captureCurrentNoteDraft = () =>
    getNotePayload({
      title: latestStateRef.current.noteTitle,
      content: latestStateRef.current.noteContent,
      contentHtml: latestStateRef.current.noteContentHtml,
      noteLanguage: latestStateRef.current.noteLanguage,
      noteFontStyle: latestStateRef.current.noteFontStyle,
      noteColor: latestStateRef.current.noteColor,
      noteTextSize: latestStateRef.current.noteTextSize,
      noteRuledLines: latestStateRef.current.noteRuledLines,
    });

  const captureCurrentCodeDraft = () =>
    getCodePayload({
      title: latestStateRef.current.codeTitle,
      code: latestStateRef.current.codeText,
    });

  const handleNoteConflict = useCallback(
    (freshNote) => {
      if (!freshNote) {
        setNoteSaveStatus("error");
        showToast("Note save failed", "error");
        return false;
      }

      const localDraft = captureCurrentNoteDraft();
      setNotes((prev) => replaceItemById(prev, freshNote));
      setActiveNoteId(freshNote._id);
      applyDraftToActiveNote(
        getNoteDraft(freshNote, defaultNoteRuledLines),
        getSavedAtLabel(freshNote),
        { revision: getEntityRevision(freshNote) }
      );
      setNoteSaveStatus("error");
      showToast(
        "This note changed in another tab. Latest version loaded.",
        "error",
        "Restore Draft",
        async () => {
          setActiveNoteId(freshNote._id);
          applyDraftToActiveNote(localDraft, getSavedAtLabel(freshNote), {
            markSaved: false,
            revision: getEntityRevision(freshNote),
          });
          setNoteSaveStatus("idle");
        }
      );
      return false;
    },
    [applyDraftToActiveNote, defaultNoteRuledLines, showToast]
  );

  const handleCodeConflict = useCallback(
    (freshCode) => {
      if (!freshCode) {
        setCodeSaveStatus("error");
        showToast("Code save failed", "error");
        return false;
      }

      const localDraft = captureCurrentCodeDraft();
      setCodes((prev) => replaceItemById(prev, freshCode));
      setActiveCodeId(freshCode._id);
      applyDraftToActiveCode(getCodeDraft(freshCode), getSavedAtLabel(freshCode), {
        revision: getEntityRevision(freshCode),
      });
      setCodeSaveStatus("error");
      showToast(
        "This code entry changed in another tab. Latest version loaded.",
        "error",
        "Restore Draft",
        async () => {
          setActiveCodeId(freshCode._id);
          applyDraftToActiveCode(localDraft, getSavedAtLabel(freshCode), {
            markSaved: false,
            revision: getEntityRevision(freshCode),
          });
          setCodeSaveStatus("idle");
        }
      );
      return false;
    },
    [applyDraftToActiveCode, showToast]
  );

  const setNoteTitleValue = (value) => {
    setNoteTitle(value);
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteContentValue = (value) => {
    if (typeof value === "string") {
      setNoteContent(value);
      setNoteContentHtml(normalizeNoteHtml("", value));
    } else {
      const normalizedHtml = normalizeNoteHtml(
        value?.html,
        typeof value?.plainText === "string" ? value.plainText : ""
      );
      const plainText = extractPlainTextFromHtml(normalizedHtml);
      setNoteContent(plainText);
      setNoteContentHtml(normalizedHtml);
    }
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteLanguageValue = (value) => {
    setNoteLanguage(value ?? DEFAULT_NOTE_LANGUAGE);
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteFontStyleValue = (value) => {
    setNoteFontStyle(value ?? DEFAULT_NOTE_FONT_STYLE);
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteColorValue = (value) => {
    setNoteColor(normalizeNoteColor(value ?? DEFAULT_NOTE_COLOR));
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteTextSizeValue = (value) => {
    setNoteTextSize(value ?? DEFAULT_NOTE_TEXT_SIZE);
    if (noteSaveStatus !== "saving") {
      setNoteSaveStatus("idle");
    }
  };

  const setNoteRuledLinesValue = (value) => {
    setNoteRuledLines(Boolean(value));
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
          ...getNotePayload({
            title: noteTitle,
            content: noteContent,
            contentHtml: noteContentHtml,
            noteLanguage,
            noteFontStyle,
            noteColor,
            noteTextSize,
            noteRuledLines,
          }),
          revision: noteRevision,
        },
        workspaceAccessToken
      );
      const updated = data?.note;
      if (!updated) {
        throw new Error("Missing note payload");
      }

      setNotes((prev) => replaceItemById(prev, updated));
      applyDraftToActiveNote(
        getNoteDraft(updated, defaultNoteRuledLines),
        getSavedAtLabel(updated),
        { revision: getEntityRevision(updated) }
      );
      setNoteSaveStatus("saved");
      if (!silent) showToast("Saved note", "success");
      broadcastWorkspaceMutation("note.updated", { noteId: updated._id });
      return true;
    } catch (error) {
      if (error?.status === 409) {
        return handleNoteConflict(error?.payload?.note);
      }

      setNoteSaveStatus("error");
      showToast("Note save failed", "error");
      return false;
    }
  };

  const saveNoteIfDirty = async (options = {}) => {
    if (!noteIsDirty) return true;
    return persistNote(options);
  };

  const createNote = async () => {
    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    try {
      const data = await createNoteAPI(
        workspaceId,
        { noteRuledLines: defaultNoteRuledLines },
        workspaceAccessToken
      );
      const created = data?.note;
      if (!created) {
        throw new Error("Missing note payload");
      }

      setNotes((prev) => [...prev, created]);
      setActiveNoteId(created._id);
      applyDraftToActiveNote(
        getNoteDraft(created, defaultNoteRuledLines),
        getSavedAtLabel(created),
        { revision: getEntityRevision(created) }
      );
      setNoteSaveStatus("idle");
      showToast("Note created", "success");
      broadcastWorkspaceMutation("note.created", { noteId: created._id });
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
    applyDraftToActiveNote(
      getNoteDraft(note, defaultNoteRuledLines),
      getSavedAtLabel(note),
      { revision: getEntityRevision(note) }
    );
    setNoteSaveStatus("idle");
  };

  const saveNote = async () => {
    await persistNote();
  };

  const finishNote = async () => {
    const ok = await saveNoteIfDirty();
    if (!ok) return;
    clearActiveNoteDraft();
  };

  const togglePinNote = (id) => {
    setPinnedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const restoreNotes = async (items) => {
    if (!items || items.length === 0) return;

    try {
      const createdNotes = [];
      for (const item of items) {
        const data = await createNoteAPI(
          workspaceId,
          getNotePayload({
            title: item.note.title,
            content: item.note.content,
            contentHtml: item.note.contentHtml,
            noteLanguage: item.note.noteLanguage,
            noteFontStyle: item.note.noteFontStyle,
            noteColor: item.note.noteColor,
            noteTextSize: item.note.noteTextSize,
            noteRuledLines: item.note.noteRuledLines,
          }),
          workspaceAccessToken
        );

        const created = data?.note;
        if (!created) continue;

        createdNotes.push(created);
        setNotes((prev) => [...prev, created]);
        if (item.wasPinned) {
          setPinnedNoteIds((prev) =>
            prev.includes(created._id) ? prev : [...prev, created._id]
          );
        }
      }

      if (createdNotes.length > 0) {
        broadcastWorkspaceMutation("note.restored", {
          noteIds: createdNotes.map((note) => note._id),
        });
      }
      showToast(items.length === 1 ? "Note restored" : "Notes restored", "success");
    } catch {
      showToast("Restore failed", "error");
    }
  };

  const renameNote = async (noteId, nextTitle) => {
    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    const note = latestStateRef.current.notes.find((item) => item._id === noteId);
    if (!note) return;

    const isActiveNote = noteId === latestStateRef.current.activeNoteId;
    const localDraft = isActiveNote
      ? captureCurrentNoteDraft()
      : getNotePayload({
          title: nextTitle ?? "",
          content: note.content ?? "",
          contentHtml: note.contentHtml,
          noteLanguage: note.noteLanguage,
          noteFontStyle: note.noteFontStyle,
          noteColor: note.noteColor,
          noteTextSize: note.noteTextSize,
          noteRuledLines: note.noteRuledLines,
        });

    try {
      const data = await updateNoteAPI(
        workspaceId,
        noteId,
        {
          ...(isActiveNote
            ? {
                ...localDraft,
                title: nextTitle ?? "",
              }
            : localDraft),
          revision: isActiveNote
            ? latestStateRef.current.noteRevision
            : getEntityRevision(note),
        },
        workspaceAccessToken
      );
      const updated = data?.note;
      if (!updated) {
        throw new Error("Missing note payload");
      }

      setNotes((prev) => replaceItemById(prev, updated));
      if (isActiveNote) {
        setActiveNoteId(updated._id);
        applyDraftToActiveNote(
          getNoteDraft(updated, defaultNoteRuledLines),
          getSavedAtLabel(updated),
          { revision: getEntityRevision(updated) }
        );
      }
      showToast("Title updated", "success");
      broadcastWorkspaceMutation("note.renamed", { noteId: updated._id });
    } catch (error) {
      if (error?.status === 409) {
        handleNoteConflict(error?.payload?.note);
        return;
      }
      showToast("Rename failed", "error");
    }
  };

  const deleteNotesFromState = useCallback(
    (ids) => {
      const idSet = new Set(ids);
      setNotes((prev) => prev.filter((note) => !idSet.has(note._id)));
      setPinnedNoteIds((prev) => prev.filter((id) => !idSet.has(id)));
      if (ids.includes(latestStateRef.current.activeNoteId)) {
        clearActiveNoteDraft();
      }
    },
    [clearActiveNoteDraft]
  );

  const deleteNotes = async (noteIds) => {
    const uniqueIds = Array.from(new Set(noteIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    const ok = await saveNoteIfDirty({ silent: true });
    if (!ok) return;

    const notesToDelete = latestStateRef.current.notes.filter((note) =>
      uniqueIds.includes(note._id)
    );
    const restoreItems = notesToDelete.map((note) => ({
      note,
      wasPinned: pinnedNoteIds.includes(note._id),
    }));

    try {
      for (const id of uniqueIds) {
        await deleteNoteAPI(workspaceId, id, workspaceAccessToken);
      }
      deleteNotesFromState(uniqueIds);
      broadcastWorkspaceMutation("note.deleted", { noteIds: uniqueIds });

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
          ...getCodePayload({
            title: codeTitle,
            code: codeText,
          }),
          revision: codeRevision,
        },
        workspaceAccessToken
      );
      const updated = data?.code;
      if (!updated) {
        throw new Error("Missing code payload");
      }

      setCodes((prev) => replaceItemById(prev, updated));
      applyDraftToActiveCode(getCodeDraft(updated), getSavedAtLabel(updated), {
        revision: getEntityRevision(updated),
      });
      setCodeSaveStatus("saved");
      if (!silent) showToast("Saved code", "success");
      broadcastWorkspaceMutation("code.updated", { codeId: updated._id });
      return true;
    } catch (error) {
      if (error?.status === 409) {
        return handleCodeConflict(error?.payload?.code);
      }

      setCodeSaveStatus("error");
      showToast("Code save failed", "error");
      return false;
    }
  };

  const saveCodeIfDirty = async (options = {}) => {
    if (!codeIsDirty) return true;
    return persistCode(options);
  };

  const createCode = async () => {
    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    try {
      const data = await createCodeAPI(workspaceId, {}, workspaceAccessToken);
      const created = data?.code;
      if (!created) {
        throw new Error("Missing code payload");
      }

      setCodes((prev) => [...prev, created]);
      setActiveCodeId(created._id);
      applyDraftToActiveCode(getCodeDraft(created), getSavedAtLabel(created), {
        revision: getEntityRevision(created),
      });
      setCodeSaveStatus("idle");
      showToast("Code created", "success");
      broadcastWorkspaceMutation("code.created", { codeId: created._id });
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
    applyDraftToActiveCode(getCodeDraft(entry), getSavedAtLabel(entry), {
      revision: getEntityRevision(entry),
    });
    setCodeSaveStatus("idle");
  };

  const saveCode = async () => {
    await persistCode();
  };

  const finishCode = async () => {
    const ok = await saveCodeIfDirty();
    if (!ok) return;
    clearActiveCodeDraft();
  };

  const togglePinCode = (id) => {
    setPinnedCodeIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const restoreCodes = async (items) => {
    if (!items || items.length === 0) return;

    try {
      const createdCodes = [];
      for (const item of items) {
        const data = await createCodeAPI(
          workspaceId,
          {
            title: item.code.title,
            code: item.code.code,
          },
          workspaceAccessToken
        );

        const created = data?.code;
        if (!created) continue;

        createdCodes.push(created);
        setCodes((prev) => [...prev, created]);
        if (item.wasPinned) {
          setPinnedCodeIds((prev) =>
            prev.includes(created._id) ? prev : [...prev, created._id]
          );
        }
      }

      if (createdCodes.length > 0) {
        broadcastWorkspaceMutation("code.restored", {
          codeIds: createdCodes.map((entry) => entry._id),
        });
      }
      showToast(items.length === 1 ? "Code restored" : "Codes restored", "success");
    } catch {
      showToast("Restore failed", "error");
    }
  };

  const renameCode = async (codeId, nextTitle) => {
    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    const entry = latestStateRef.current.codes.find((item) => item._id === codeId);
    if (!entry) return;

    const isActiveCode = codeId === latestStateRef.current.activeCodeId;

    try {
      const data = await updateCodeAPI(
        workspaceId,
        codeId,
        {
          title: nextTitle ?? "",
          code: isActiveCode ? latestStateRef.current.codeText : entry.code ?? "",
          revision: isActiveCode
            ? latestStateRef.current.codeRevision
            : getEntityRevision(entry),
        },
        workspaceAccessToken
      );
      const updated = data?.code;
      if (!updated) {
        throw new Error("Missing code payload");
      }

      setCodes((prev) => replaceItemById(prev, updated));
      if (isActiveCode) {
        setActiveCodeId(updated._id);
        applyDraftToActiveCode(getCodeDraft(updated), getSavedAtLabel(updated), {
          revision: getEntityRevision(updated),
        });
      }
      showToast("Title updated", "success");
      broadcastWorkspaceMutation("code.renamed", { codeId: updated._id });
    } catch (error) {
      if (error?.status === 409) {
        handleCodeConflict(error?.payload?.code);
        return;
      }
      showToast("Rename failed", "error");
    }
  };

  const deleteCodesFromState = useCallback(
    (ids) => {
      const idSet = new Set(ids);
      setCodes((prev) => prev.filter((entry) => !idSet.has(entry._id)));
      setPinnedCodeIds((prev) => prev.filter((id) => !idSet.has(id)));
      if (ids.includes(latestStateRef.current.activeCodeId)) {
        clearActiveCodeDraft();
      }
    },
    [clearActiveCodeDraft]
  );

  const deleteCodes = async (codeIds) => {
    const uniqueIds = Array.from(new Set(codeIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    const ok = await saveCodeIfDirty({ silent: true });
    if (!ok) return;

    const codesToDelete = latestStateRef.current.codes.filter((entry) =>
      uniqueIds.includes(entry._id)
    );
    const restoreItems = codesToDelete.map((entry) => ({
      code: entry,
      wasPinned: pinnedCodeIds.includes(entry._id),
    }));

    try {
      for (const id of uniqueIds) {
        await deleteCodeAPI(workspaceId, id, workspaceAccessToken);
      }
      deleteCodesFromState(uniqueIds);
      broadcastWorkspaceMutation("code.deleted", { codeIds: uniqueIds });

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
    workspaceDisplayName,
    isLoadingWorkspace,
    workspaceLoadError,
    retryWorkspaceLoad: () =>
      refreshWorkspaceFromServer({ preserveSelection: true })
        .then(() => {
          setWorkspaceLoadError("");
        })
        .catch((error) => {
          setWorkspaceLoadError(error?.message || "Unable to load this workspace.");
          void reportError(error, {
            source: "workspace.retry-load",
            workspaceId,
          });
        }),
    toast,
    dismissToast,
    notes,
    activeNoteId,
    noteTitle,
    noteContent,
    noteContentHtml,
    noteLanguage,
    noteFontStyle,
    noteColor,
    noteTextSize,
    noteRuledLines,
    noteIsDirty,
    noteSaveStatus,
    lastNoteSavedAt,
    pinnedNoteIds,
    setNoteTitle: setNoteTitleValue,
    setNoteContent: setNoteContentValue,
    setNoteLanguage: setNoteLanguageValue,
    setNoteFontStyle: setNoteFontStyleValue,
    setNoteColor: setNoteColorValue,
    setNoteTextSize: setNoteTextSizeValue,
    setNoteRuledLines: setNoteRuledLinesValue,
    createNote,
    selectNote,
    saveNote,
    finishNote,
    saveNoteIfDirty,
    renameNote,
    togglePinNote,
    deleteNote,
    deleteNotes,
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
    saveWorkspaceIfDirty,
  };
}
