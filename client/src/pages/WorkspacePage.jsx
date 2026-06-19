import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceGate from "../components/WorkspaceGate.jsx";
import Sidebar from "../components/Sidebar.jsx";
import NoteEditor from "../components/NoteEditor.jsx";
import EditorFontSelect from "../components/EditorFontSelect.jsx";
import StatusState from "../components/StatusState.jsx";
import { useWorkspace } from "../hooks/useWorkspace";
import { useNotes } from "../hooks/useNotes";
import {
  handleAutoReplaceBeforeInput,
  handleAutoReplaceKeyDown,
} from "../utils/autoReplace.js";
import {
  CODE_FONT_OPTIONS,
  DEFAULT_CODE_FONT_STYLE,
  getCodeFontClassName,
} from "../languages/index.js";

const SIDEBAR_STORAGE_KEY = "textpad.sidebarWidth";
const SIDEBAR_MIN = 280;
const SIDEBAR_MAX = 440;
const MOBILE_SIDEBAR_MAX_WIDTH = 400;

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia(query);

    const handleChange = (event) => {
      setMatches(event.matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }

    // Safari < 14 / old Chromium
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, [query]);

  return matches;
}

function WorkspaceEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="panel-muted flex h-full flex-col items-start justify-center p-8 text-slate-600">
      <p className="section-kicker">Code Studio</p>
      <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      <button className="btn btn-primary mt-5" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

function CodeEditorPanel({
  activeCodeId,
  codeTitle,
  codeText,
  setCodeTitle,
  setCodeText,
  onSave,
  onFinishSave,
  onCreateCode,
  codeSaveStatus,
  isLoading,
  errorMessage,
  onRetry,
  codeIsDirty,
  lastCodeSavedAt,
  codeLines,
  lineNumbersRef,
  codeRef,
  onScroll,
  codeAutoReplaceProps,
  codeFontStyle = DEFAULT_CODE_FONT_STYLE,
  onCodeFontStyleChange,
  isUpdatingCodeFont = false,
}) {
  const isSaving = codeSaveStatus === "saving";
  const codeFontClassName = getCodeFontClassName(codeFontStyle);

  if (isLoading) {
    return (
      <StatusState
        tone="loading"
        kicker="Code Studio"
        title="Loading code entries"
        description="Your snippets are being restored into the workspace."
        className="h-full"
      />
    );
  }

  if (errorMessage) {
    return (
      <StatusState
        tone="error"
        kicker="Code Studio"
        title="Code entries could not load"
        description={errorMessage}
        actionLabel="Try Again"
        onAction={onRetry}
        className="h-full"
      />
    );
  }

  let statusLabel = "";
  if (codeSaveStatus === "saving") statusLabel = "Saving...";
  if (codeSaveStatus === "saved") statusLabel = "Saved";
  if (codeSaveStatus === "error") statusLabel = "Save failed";

  const lastSavedLabel = lastCodeSavedAt
    ? new Date(lastCodeSavedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not saved yet";

  if (!activeCodeId) {
    return (
      <WorkspaceEmptyState
        title="No code selected"
        description="Create a code entry or pick one from the list to keep snippets, experiments, and references together."
        actionLabel="Create code"
        onAction={onCreateCode}
      />
    );
  }

  return (
    <div className="panel flex h-full flex-col gap-4 p-4 md:p-5">
      <div className="panel-inset flex flex-wrap items-center justify-between gap-3 p-3.5 md:p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-kicker">Code Studio</p>
            <span className="ui-chip">{codeLines} lines</span>
            <span className="ui-chip">Saved {lastSavedLabel}</span>
            {statusLabel ? (
              <span className="ui-chip">{statusLabel}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep the title compact, then let the code surface stay in view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EditorFontSelect
            label="Code Font"
            value={codeFontStyle}
            options={CODE_FONT_OPTIONS}
            onChange={onCodeFontStyleChange}
            disabled={isSaving || isUpdatingCodeFont}
            kind="code"
          />
          <button className="btn btn-ghost" onClick={onSave} disabled={isSaving}>
            Save
          </button>
          <button
            className="btn btn-primary"
            onClick={onFinishSave}
            disabled={isSaving || !codeIsDirty}
          >
            Finish
          </button>
        </div>
      </div>

      <input
        className="input text-base font-medium text-slate-900"
        placeholder="Code title"
        value={codeTitle}
        onChange={(event) => setCodeTitle(event.target.value)}
        disabled={isSaving}
      />

      <div className="flex flex-1 overflow-hidden rounded-[1.75rem] border border-[rgba(104,84,58,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(247,240,229,0.74)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_18px_36px_rgba(76,58,38,0.06)]">
        <div
          ref={lineNumbersRef}
          className={`max-h-full min-w-[58px] overflow-hidden border-r border-[rgba(104,84,58,0.14)] bg-[rgba(255,255,255,0.55)] px-3 py-4 text-right text-xs leading-6 text-slate-400 ${codeFontClassName}`}
        >
          {Array.from({ length: codeLines }).map((_, index) => (
            <div key={index} className="leading-6">
              {index + 1}
            </div>
          ))}
        </div>

        <textarea
          ref={codeRef}
          className={`min-h-[420px] flex-1 resize-none bg-transparent px-5 py-4 text-[13px] leading-6 text-slate-800 outline-none ${codeFontClassName}`}
          placeholder="Write code here..."
          value={codeText}
          {...codeAutoReplaceProps}
          onChange={(event) => setCodeText(event.target.value)}
          onScroll={onScroll}
          disabled={isSaving}
        />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ui-chip">Monospaced editor</span>
          <span className="ui-chip">Sidebar switching autosaves</span>
        </div>

        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {codeTitle?.trim() ? "Ready for the next change" : "Name the snippet, then keep building"}
        </span>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const {
    workspace,
    workspaceAccessToken,
    workspaceId,
    setWorkspaceId,
    workspacePassword,
    setWorkspacePassword,
    requiresWorkspacePassword,
    workspaceOpenError,
    isOpeningWorkspace,
    recentWorkspaces,
    openWorkspace,
    openRecentWorkspace,
    removeRecentWorkspace,
    deleteWorkspace,
    updatePreferences,
    setWorkspaceSaveHandler,
  } = useWorkspace();

  const notesState = useNotes(workspace, workspaceAccessToken);
  const [viewMode, setViewMode] = useState("notes");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [modeIndicatorStyle, setModeIndicatorStyle] = useState({ left: 0, width: 0 });
  const modeSelectorRef = useRef(null);
  const modeButtonsRef = useRef({});

  useEffect(() => {
    if (isDesktop) return;
    const activeEl = modeButtonsRef.current[viewMode];
    const container = modeSelectorRef.current;
    if (activeEl && container) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setModeIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }
  }, [viewMode, isDesktop]);
  const [isNoteFocusMode, setIsNoteFocusMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 320;
    if (!Number.isFinite(parsed)) return 320;
    return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parsed));
  });

  const prefs = workspace?.preferences ?? {};
  const autoReplaceEnabled = prefs.autoReplace ?? true;
  const ruledNotesEnabled = prefs.ruledNotes ?? true;
  const confirmDeletes = prefs.confirmDeletes ?? true;
  const showAutosaveToasts = prefs.showAutosaveToasts ?? false;
  const codeFontStyle = prefs.codeFontStyle ?? DEFAULT_CODE_FONT_STYLE;
  const autosaveOptions = useMemo(
    () => ({ silent: !showAutosaveToasts }),
    [showAutosaveToasts]
  );
  const codeAutoReplaceProps = autoReplaceEnabled
    ? {
        onBeforeInput: handleAutoReplaceBeforeInput,
        onKeyDown: handleAutoReplaceKeyDown,
      }
    : {};

  const codeLines = useMemo(() => {
    const count = notesState.codeText.split("\n").length;
    return count > 0 ? count : 1;
  }, [notesState.codeText]);
  const lineNumbersRef = useRef(null);
  const codeRef = useRef(null);
  const isResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);
  const mobileDrawerGestureRef = useRef(null);
  const [mobileDrawerOffset, setMobileDrawerOffset] = useState(null);
  const [isMobileDrawerDragging, setIsMobileDrawerDragging] = useState(false);

  const handleCodeScroll = () => {
    if (!lineNumbersRef.current || !codeRef.current) return;
    lineNumbersRef.current.scrollTop = codeRef.current.scrollTop;
  };

  useEffect(() => {
    if (viewMode !== "notes") {
      setIsNoteFocusMode(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isDesktop) {
      mobileDrawerGestureRef.current = null;
      setIsMobileDrawerDragging(false);
      setMobileDrawerOffset(null);
      setIsSidebarOpen(false);
    }
  }, [isDesktop]);

  const handlePreferenceChange = async (key, value) => {
    if (!workspace) return;
    if (key === "codeFontStyle" && codeFontStyle === value) return;

    setSavingPreferenceKey(key);
    try {
      await updatePreferences({ [key]: value });
    } finally {
      setSavingPreferenceKey("");
    }
  };

  useEffect(() => {
    if (!workspace) {
      setWorkspaceSaveHandler(null);
      return;
    }

    // Used by the navbar to autosave before leaving the workspace route or closing it.
    setWorkspaceSaveHandler(() => notesState.saveWorkspaceIfDirty(autosaveOptions));
    return () => setWorkspaceSaveHandler(null);
  }, [autosaveOptions, notesState, setWorkspaceSaveHandler, workspace]);

  useEffect(() => {
    const handleMove = (event) => {
      if (!isResizingRef.current) return;
      const dx = event.clientX - resizeStartXRef.current;
      const next = resizeStartWidthRef.current + dx;
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, next)));
    };

    const handleUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMove = (event) => {
      const gesture = mobileDrawerGestureRef.current;
      if (!gesture) return;
      if (gesture.pointerId !== undefined && event.pointerId !== gesture.pointerId) {
        return;
      }

      const dx = event.clientX - gesture.startX;
      const nextOffset =
        gesture.mode === "open"
          ? Math.min(0, Math.max(-gesture.drawerWidth, -gesture.drawerWidth + dx))
          : Math.min(0, Math.max(-gesture.drawerWidth, dx));

      setMobileDrawerOffset(nextOffset);
    };

    const finishGesture = (event) => {
      const gesture = mobileDrawerGestureRef.current;
      if (!gesture) return;
      if (gesture.pointerId !== undefined && event.pointerId !== gesture.pointerId) {
        return;
      }

      const finalOffset =
        typeof mobileDrawerOffset === "number"
          ? mobileDrawerOffset
          : gesture.mode === "open"
          ? -gesture.drawerWidth
          : 0;

      const shouldOpen = finalOffset > -gesture.drawerWidth * 0.45;
      mobileDrawerGestureRef.current = null;
      setIsMobileDrawerDragging(false);
      setMobileDrawerOffset(null);
      setIsSidebarOpen(shouldOpen);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", finishGesture);
    window.addEventListener("pointercancel", finishGesture);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", finishGesture);
      window.removeEventListener("pointercancel", finishGesture);
    };
  }, [mobileDrawerOffset]);

  const handleResizeStart = (event) => {
    // Left click / primary pointer only.
    if (event.button !== 0) return;
    isResizingRef.current = true;
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const getMobileDrawerWidth = () => {
    if (typeof window === "undefined") {
      return 320;
    }

    return Math.min(window.innerWidth * 0.92, MOBILE_SIDEBAR_MAX_WIDTH);
  };

  const startMobileDrawerGesture = (event, mode) => {
    if (isDesktop) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const drawerWidth = getMobileDrawerWidth();
    mobileDrawerGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      drawerWidth,
      mode,
    };
    setIsMobileDrawerDragging(true);
    setIsSidebarOpen(true);
    setMobileDrawerOffset(mode === "open" ? -drawerWidth : 0);
  };

  const toast = notesState.toast;
  const isDesktopNoteFocusMode =
    isDesktop && viewMode === "notes" && isNoteFocusMode;
  const mobileDrawerWidth = getMobileDrawerWidth();
  const resolvedMobileDrawerOffset = isMobileDrawerDragging
    ? mobileDrawerOffset ?? (isSidebarOpen ? 0 : -mobileDrawerWidth)
    : isSidebarOpen
    ? 0
    : -mobileDrawerWidth;
  const mobileDrawerProgress = Math.max(
    0,
    Math.min(1, 1 - Math.abs(resolvedMobileDrawerOffset) / mobileDrawerWidth)
  );
  const toastToneClass =
    toast?.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : toast?.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-[rgba(104,84,58,0.14)] bg-white/85 text-slate-700";

  const editorPanel =
    notesState.workspaceLoadError ? (
      <StatusState
        tone="error"
        kicker={viewMode === "code" ? "Code Studio" : "Note Studio"}
        title="This workspace could not load"
        description={notesState.workspaceLoadError}
        actionLabel="Try Again"
        onAction={notesState.retryWorkspaceLoad}
        className="h-full"
      />
    ) :
    viewMode === "code" ? (
      <CodeEditorPanel
        activeCodeId={notesState.activeCodeId}
        codeTitle={notesState.codeTitle}
        codeText={notesState.codeText}
        setCodeTitle={notesState.setCodeTitle}
        setCodeText={notesState.setCodeText}
        onSave={notesState.saveCode}
        onFinishSave={notesState.finishCode}
        onCreateCode={notesState.createCode}
        codeSaveStatus={notesState.codeSaveStatus}
        codeIsDirty={notesState.codeIsDirty}
        lastCodeSavedAt={notesState.lastCodeSavedAt}
        codeLines={codeLines}
        lineNumbersRef={lineNumbersRef}
        codeRef={codeRef}
        onScroll={handleCodeScroll}
        codeAutoReplaceProps={codeAutoReplaceProps}
        codeFontStyle={codeFontStyle}
        onCodeFontStyleChange={(value) =>
          handlePreferenceChange("codeFontStyle", value)
        }
        isUpdatingCodeFont={savingPreferenceKey === "codeFontStyle"}
        isLoading={notesState.isLoadingWorkspace}
        errorMessage={notesState.workspaceLoadError}
        onRetry={notesState.retryWorkspaceLoad}
      />
    ) : (
      <NoteEditor
        activeNoteId={notesState.activeNoteId}
        isLoadingNotes={notesState.isLoadingWorkspace}
        loadError={notesState.workspaceLoadError}
        onRetryLoad={notesState.retryWorkspaceLoad}
        hasNotes={notesState.notes.length > 0}
        title={notesState.noteTitle}
        content={notesState.noteContent}
        contentHtml={notesState.noteContentHtml}
        setTitle={notesState.setNoteTitle}
        setContent={notesState.setNoteContent}
        onSave={notesState.saveNote}
        onFinishSave={notesState.finishNote}
        onCreateNote={notesState.createNote}
        isDirty={notesState.noteIsDirty}
        saveStatus={notesState.noteSaveStatus}
        lastSavedAt={notesState.lastNoteSavedAt}
        autoReplaceEnabled={autoReplaceEnabled}
        ruledLinesEnabled={ruledNotesEnabled}
        noteLanguage={notesState.noteLanguage}
        onNoteLanguageChange={notesState.setNoteLanguage}
        noteFontStyle={notesState.noteFontStyle}
        onNoteFontStyleChange={notesState.setNoteFontStyle}
        noteColor={notesState.noteColor}
        onNoteColorChange={notesState.setNoteColor}
        noteTextSize={notesState.noteTextSize}
        onNoteTextSizeChange={notesState.setNoteTextSize}
        noteRuledLines={notesState.noteRuledLines}
        onNoteRuledLinesChange={notesState.setNoteRuledLines}
        isFocusMode={isNoteFocusMode}
        onToggleFocusMode={setIsNoteFocusMode}
      />
    );

  if (!workspace) {
    return (
      <WorkspaceGate
        workspaceId={workspaceId}
        setWorkspaceId={setWorkspaceId}
        workspacePassword={workspacePassword}
        setWorkspacePassword={setWorkspacePassword}
        requiresWorkspacePassword={requiresWorkspacePassword}
        workspaceOpenError={workspaceOpenError}
        isOpeningWorkspace={isOpeningWorkspace}
        recentWorkspaces={recentWorkspaces}
        onOpen={openWorkspace}
        onOpenRecent={openRecentWorkspace}
        onRemoveRecent={removeRecentWorkspace}
      />
    );
  }

  return (
    <div className="motion-fade-in relative space-y-4">
      {toast ? (
        <div
          className={`app-toast fixed right-4 top-24 z-20 flex max-w-[min(92vw,420px)] items-center gap-2 rounded-[1.5rem] border px-4 py-3 text-sm shadow-[0_24px_50px_rgba(76,58,38,0.14)] backdrop-blur-xl md:right-8 ${toastToneClass}`}
        >
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={toast.onAction}>
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            className="btn btn-ghost px-3 py-1.5 text-xs"
            onClick={notesState.dismissToast}
          >
            Close
          </button>
        </div>
      ) : null}
      <div
        className="w-full relative"
        style={{
          "--sidebar-w": `${sidebarWidth}px`,
        }}
      >
        {isDesktop ? (
          <div
            className={`min-h-[calc(100vh-13rem)] gap-4 md:items-stretch ${
              isDesktopNoteFocusMode || isSidebarCollapsed
                ? "md:grid md:[grid-template-columns:minmax(0,1fr)]"
                : "md:grid md:[grid-template-columns:var(--sidebar-w)_minmax(0,1fr)]"
            }`}
          >
            {!isDesktopNoteFocusMode && !isSidebarCollapsed ? (
            <div className="relative min-w-0 flex flex-col h-full">
              <Sidebar
                workspace={workspace}
                notes={notesState.notes}
                codes={notesState.codes}
                isLoadingNotes={notesState.isLoadingWorkspace}
                confirmDeletes={confirmDeletes}
                activeNoteId={notesState.activeNoteId}
                activeCodeId={notesState.activeCodeId}
                isDirty={notesState.noteIsDirty}
                isCodeDirty={notesState.codeIsDirty}
                pinnedNoteIds={notesState.pinnedNoteIds}
                pinnedCodeIds={notesState.pinnedCodeIds}
                onCollapse={() => setIsSidebarCollapsed(true)}
                onCreateNote={async () => {
                  const ok = await notesState.saveCodeIfDirty(autosaveOptions);
                  if (!ok) return;
                  await notesState.createNote();
                  setViewMode("notes");
                }}
                onCreateCode={async () => {
                  const ok = await notesState.saveNoteIfDirty(autosaveOptions);
                  if (!ok) return;
                  await notesState.createCode();
                  setViewMode("code");
                }}
                onSelectNote={async (note) => {
                  const ok = await notesState.saveCodeIfDirty(autosaveOptions);
                  if (!ok) return;
                  await notesState.selectNote(note);
                  setViewMode("notes");
                }}
                onSelectCode={async (entry) => {
                  const ok = await notesState.saveNoteIfDirty(autosaveOptions);
                  if (!ok) return;
                  await notesState.selectCode(entry);
                  setViewMode("code");
                }}
                onRenameNote={notesState.renameNote}
                onRenameCode={notesState.renameCode}
                onTogglePin={notesState.togglePinNote}
                onTogglePinCode={notesState.togglePinCode}
                onDeleteNote={notesState.deleteNote}
                onDeleteNotes={notesState.deleteNotes}
                onDeleteCode={notesState.deleteCode}
                onDeleteCodes={notesState.deleteCodes}
                onDeleteWorkspace={deleteWorkspace}
              />

              <div
                className="absolute -right-2 top-4 bottom-4 hidden md:flex"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
              >
                <button
                  type="button"
                  onPointerDown={handleResizeStart}
                  className="group flex w-4 cursor-col-resize items-stretch justify-center"
                  aria-label="Drag to resize"
                >
                  <span className="my-1 w-[6px] rounded-full bg-[rgba(104,84,58,0.14)] transition group-hover:bg-[rgba(188,116,65,0.32)]" />
                </button>
              </div>
            </div>
            ) : null}

            <div className="min-w-0 relative flex flex-col h-full">
              {isSidebarCollapsed && !isDesktopNoteFocusMode ? (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="absolute -left-3.5 top-6 z-20 grid h-8 w-8 place-items-center rounded-full border border-[rgba(104,84,58,0.14)] bg-white shadow-[0_8px_16px_rgba(76,58,38,0.06)] hover:bg-slate-50 transition duration-200"
                  title="Expand sidebar list"
                  aria-label="Expand sidebar list"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ) : null}
              {editorPanel}
            </div>
          </div>
        ) : (
          <>
            <div className="motion-rise-in panel-inset mb-3 p-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  Open List
                </button>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Swipe from the left edge
                </p>
                 <div 
                  ref={modeSelectorRef}
                  className="relative rounded-full border border-[rgba(104,84,58,0.14)] bg-white/45 p-1"
                >
                  <span
                    className="absolute top-1 bottom-1 rounded-full bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)] shadow-[0_14px_28px_rgba(149,81,35,0.22)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                      left: `${modeIndicatorStyle.left}px`,
                      width: `${modeIndicatorStyle.width}px`,
                      opacity: modeIndicatorStyle.width > 0 ? 1 : 0,
                    }}
                  />
                  <div className="relative z-10 flex items-center gap-1">
                    <button
                      ref={(el) => { modeButtonsRef.current["notes"] = el; }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                        viewMode === "notes" ? "text-white" : "text-slate-700 hover:text-slate-900"
                      }`}
                      onClick={() => setViewMode("notes")}
                    >
                      Notes
                    </button>
                    <button
                      ref={(el) => { modeButtonsRef.current["code"] = el; }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                        viewMode === "code" ? "text-white" : "text-slate-700 hover:text-slate-900"
                      }`}
                      onClick={() => setViewMode("code")}
                    >
                      Code
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="motion-scale-in min-h-[calc(100vh-13rem)]">{editorPanel}</div>

            {!isSidebarOpen ? (
              <button
                type="button"
                className="fixed inset-y-0 left-0 z-30 w-4 md:hidden"
                aria-label="Open workspace list with a swipe gesture"
                onPointerDown={(event) => startMobileDrawerGesture(event, "open")}
              />
            ) : null}

            {isSidebarOpen || isMobileDrawerDragging ? (
              <div className="motion-fade-in fixed inset-0 z-40">
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300"
                  style={{ opacity: mobileDrawerProgress }}
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close sidebar"
                />
                <div
                  className={`absolute left-0 top-0 h-full p-3 ${isMobileDrawerDragging ? "" : "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
                  style={{
                    width: `${mobileDrawerWidth}px`,
                    transform: `translate3d(${resolvedMobileDrawerOffset}px, 0, 0)`,
                  }}
                >
                  <div className="flex h-full flex-col">
                    <div className="panel mb-2 px-4 py-3">
                      <button
                        type="button"
                        className="mx-auto mb-3 block h-1.5 w-14 rounded-full bg-[rgba(104,84,58,0.14)]"
                        aria-label="Drag to close workspace list"
                        onPointerDown={(event) =>
                          startMobileDrawerGesture(event, "close")
                        }
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-semibold text-slate-900">
                            Workspace List
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Drag left to close
                          </p>
                        </div>
                        <button
                          className="btn btn-ghost px-3 py-2"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <Sidebar
                      workspace={workspace}
                      notes={notesState.notes}
                      codes={notesState.codes}
                      isLoadingNotes={notesState.isLoadingWorkspace}
                      confirmDeletes={confirmDeletes}
                      activeNoteId={notesState.activeNoteId}
                      activeCodeId={notesState.activeCodeId}
                      isDirty={notesState.noteIsDirty}
                      isCodeDirty={notesState.codeIsDirty}
                      pinnedNoteIds={notesState.pinnedNoteIds}
                      pinnedCodeIds={notesState.pinnedCodeIds}
                      onCreateNote={async () => {
                        const ok = await notesState.saveCodeIfDirty(autosaveOptions);
                        if (!ok) return;
                        await notesState.createNote();
                        setViewMode("notes");
                        setIsSidebarOpen(false);
                      }}
                      onCreateCode={async () => {
                        const ok = await notesState.saveNoteIfDirty(autosaveOptions);
                        if (!ok) return;
                        await notesState.createCode();
                        setViewMode("code");
                        setIsSidebarOpen(false);
                      }}
                      onSelectNote={async (note) => {
                        const ok = await notesState.saveCodeIfDirty(autosaveOptions);
                        if (!ok) return;
                        await notesState.selectNote(note);
                        setViewMode("notes");
                        setIsSidebarOpen(false);
                      }}
                      onSelectCode={async (entry) => {
                        const ok = await notesState.saveNoteIfDirty(autosaveOptions);
                        if (!ok) return;
                        await notesState.selectCode(entry);
                        setViewMode("code");
                        setIsSidebarOpen(false);
                      }}
                      onRenameNote={notesState.renameNote}
                      onRenameCode={notesState.renameCode}
                      onTogglePin={notesState.togglePinNote}
                      onTogglePinCode={notesState.togglePinCode}
                      onDeleteNote={notesState.deleteNote}
                      onDeleteNotes={notesState.deleteNotes}
                      onDeleteCode={notesState.deleteCode}
                      onDeleteCodes={notesState.deleteCodes}
                      onDeleteWorkspace={deleteWorkspace}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
