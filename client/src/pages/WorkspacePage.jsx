import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceGate from "../components/WorkspaceGate.jsx";
import Sidebar from "../components/Sidebar.jsx";
import NoteEditor from "../components/NoteEditor.jsx";
import { useWorkspace } from "../hooks/useWorkspace";
import { useNotes } from "../hooks/useNotes";
import {
  handleAutoReplaceBeforeInput,
  handleAutoReplaceKeyDown,
} from "../utils/autoReplace.js";

const SIDEBAR_STORAGE_KEY = "textpad.sidebarWidth";
const SIDEBAR_MIN = 280;
const SIDEBAR_MAX = 440;

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

export default function WorkspacePage() {
  const {
    workspace,
    workspaceId,
    setWorkspaceId,
    openWorkspace,
    deleteWorkspace,
    setWorkspaceSaveHandler,
  } = useWorkspace();

  const notesState = useNotes(workspace);
  const [viewMode, setViewMode] = useState("notes");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 320;
    if (!Number.isFinite(parsed)) return 320;
    return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parsed));
  });
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const prefs = workspace?.preferences ?? {};
  const autoReplaceEnabled = prefs.autoReplace ?? true;
  const ruledNotesEnabled = prefs.ruledNotes ?? true;
  const confirmDeletes = prefs.confirmDeletes ?? true;
  const showAutosaveToasts = prefs.showAutosaveToasts ?? false;
  const autosaveOptions = { silent: !showAutosaveToasts };
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

  const handleCodeScroll = () => {
    if (!lineNumbersRef.current || !codeRef.current) return;
    lineNumbersRef.current.scrollTop = codeRef.current.scrollTop;
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

  const handleResizeStart = (event) => {
    // Left click / primary pointer only.
    if (event.button !== 0) return;
    isResizingRef.current = true;
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toast = notesState.toast;
  const toastToneClass =
    toast?.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : toast?.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-white text-slate-700";

  if (!workspace) {
    return (
      <WorkspaceGate
        workspaceId={workspaceId}
        setWorkspaceId={setWorkspaceId}
        onOpen={openWorkspace}
      />
    );
  }

  return (
    <div className="relative">
      {toast ? (
        <div
          className={`fixed right-6 top-24 z-20 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${toastToneClass}`}
        >
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <button className="btn btn-ghost px-2 py-1 text-xs" onClick={toast.onAction}>
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            className="btn btn-ghost px-2 py-1 text-xs"
            onClick={notesState.dismissToast}
          >
            Close
          </button>
        </div>
      ) : null}
      <div
        className="w-full"
        style={{
          "--sidebar-w": `${sidebarWidth}px`,
        }}
      >
        {isDesktop ? (
          <div className="min-h-[calc(100vh-12rem)] gap-4 md:grid md:[grid-template-columns:var(--sidebar-w)_12px_minmax(0,1fr)] md:items-stretch">
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
            className="relative hidden items-stretch md:flex"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
          >
            <button
              type="button"
              onPointerDown={handleResizeStart}
              className="group flex w-full cursor-col-resize items-stretch"
              aria-label="Drag to resize"
            >
              <span className="mx-auto my-2 w-[4px] rounded-full bg-slate-200/70 transition group-hover:bg-slate-300" />
            </button>
          </div>

          <div className="min-w-0">
            {viewMode === "code" ? (
              <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
                {notesState.activeCodeId ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Code Editor
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                          {notesState.codeTitle || "Untitled code"}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="btn btn-ghost"
                          onClick={notesState.saveCode}
                          disabled={notesState.codeSaveStatus === "saving"}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={notesState.finishCode}
                          disabled={
                            notesState.codeSaveStatus === "saving" ||
                            !notesState.codeIsDirty
                          }
                        >
                          Finish
                        </button>
                      </div>
                    </div>
                    <input
                      className="input"
                      placeholder="Code title"
                      value={notesState.codeTitle}
                      onChange={(event) =>
                        notesState.setCodeTitle(event.target.value)
                      }
                      disabled={notesState.codeSaveStatus === "saving"}
                    />
                    <div className="flex flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <div
                        ref={lineNumbersRef}
                        className="max-h-full min-w-[44px] overflow-hidden border-r border-slate-200 bg-slate-100/80 px-2 py-3 text-right text-xs text-slate-400"
                      >
                        {Array.from({ length: codeLines }).map((_, index) => (
                          <div key={index} className="leading-6">
                            {index + 1}
                          </div>
                        ))}
                      </div>
                      <textarea
                        ref={codeRef}
                        className="min-h-[420px] flex-1 bg-transparent px-4 py-3 font-mono text-sm text-slate-800 outline-none"
                        placeholder="Write code here..."
                        value={notesState.codeText}
                        {...codeAutoReplaceProps}
                        onChange={(event) =>
                          notesState.setCodeText(event.target.value)
                        }
                        onScroll={handleCodeScroll}
                        disabled={notesState.codeSaveStatus === "saving"}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-start justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-slate-600">
                    <p className="text-lg font-semibold text-slate-900">
                      No code selected
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a code entry or select one from the sidebar.
                    </p>
                    <button
                      className="btn btn-primary mt-4"
                      onClick={async () => {
                        await notesState.createCode();
                      }}
                    >
                      Create code
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NoteEditor
                activeNoteId={notesState.activeNoteId}
                isLoadingNotes={notesState.isLoadingWorkspace}
                hasNotes={notesState.notes.length > 0}
                title={notesState.noteTitle}
                content={notesState.noteContent}
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
              />
            )}
          </div>
        </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setIsSidebarOpen(true)}
              >
                Open List
              </button>
              <div className="flex items-center gap-2">
                <button
                  className={`btn ${viewMode === "notes" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setViewMode("notes")}
                >
                  Notes
                </button>
                <button
                  className={`btn ${viewMode === "code" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setViewMode("code")}
                >
                  Code
                </button>
              </div>
            </div>

            <div className="min-h-[calc(100vh-12rem)]">
              {viewMode === "code" ? (
                <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
                  {notesState.activeCodeId ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Code Editor
                          </p>
                          <h2 className="text-xl font-semibold text-slate-900">
                            {notesState.codeTitle || "Untitled code"}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="btn btn-ghost"
                            onClick={notesState.saveCode}
                            disabled={notesState.codeSaveStatus === "saving"}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={notesState.finishCode}
                            disabled={
                              notesState.codeSaveStatus === "saving" ||
                              !notesState.codeIsDirty
                            }
                          >
                            Finish
                          </button>
                        </div>
                      </div>
                      <input
                        className="input"
                        placeholder="Code title"
                        value={notesState.codeTitle}
                        onChange={(event) =>
                          notesState.setCodeTitle(event.target.value)
                        }
                        disabled={notesState.codeSaveStatus === "saving"}
                      />
                      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div
                          ref={lineNumbersRef}
                          className="max-h-[420px] min-w-[44px] overflow-hidden border-r border-slate-200 bg-slate-100/80 px-2 py-3 text-right text-xs text-slate-400"
                        >
                          {Array.from({ length: codeLines }).map((_, index) => (
                            <div key={index} className="leading-6">
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        <textarea
                          ref={codeRef}
                          className="min-h-[420px] flex-1 bg-transparent px-4 py-3 font-mono text-sm text-slate-800 outline-none"
                          placeholder="Write code here..."
                          value={notesState.codeText}
                          {...codeAutoReplaceProps}
                          onChange={(event) =>
                            notesState.setCodeText(event.target.value)
                          }
                          onScroll={handleCodeScroll}
                          disabled={notesState.codeSaveStatus === "saving"}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-start justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-slate-600">
                      <p className="text-lg font-semibold text-slate-900">
                        No code selected
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Create a code entry or select one from the sidebar.
                      </p>
                      <button
                        className="btn btn-primary mt-4"
                        onClick={async () => {
                          await notesState.createCode();
                        }}
                      >
                        Create code
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <NoteEditor
                  activeNoteId={notesState.activeNoteId}
                  isLoadingNotes={notesState.isLoadingWorkspace}
                  hasNotes={notesState.notes.length > 0}
                  title={notesState.noteTitle}
                  content={notesState.noteContent}
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
                />
              )}
            </div>

            {isSidebarOpen ? (
              <div className="fixed inset-0 z-40">
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close sidebar"
                />
                <div className="absolute left-0 top-0 h-full w-[min(92vw,380px)] p-3">
                  <div className="flex h-full flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">List</p>
                      <button
                        className="btn btn-ghost px-3 py-2"
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        Close
                      </button>
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
