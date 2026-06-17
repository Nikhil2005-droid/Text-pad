import { useEffect, useMemo, useState } from "react";
import { useAppFeedback } from "../context/AppFeedbackContext.jsx";
import SidebarSortSelect from "./SidebarSortSelect.jsx";

function formatDateLabel(value) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

const SORT_OPTIONS = [
  {
    value: "updated",
    label: "Recently Updated",
    description: "Show the most recently edited items first.",
  },
  {
    value: "created",
    label: "Newest First",
    description: "Bring the most recently created items to the top.",
  },
  {
    value: "title",
    label: "Title A-Z",
    description: "Keep the library ordered alphabetically.",
  },
];

export default function Sidebar({
  workspace,
  notes,
  codes,
  isLoadingNotes,
  confirmDeletes = true,
  activeNoteId,
  activeCodeId,
  isDirty,
  isCodeDirty,
  pinnedNoteIds,
  pinnedCodeIds,
  onCollapse,
  onCreateNote,
  onCreateCode,
  onSelectNote,
  onSelectCode,
  onRenameNote,
  onRenameCode,
  onTogglePin,
  onTogglePinCode,
  onDeleteNote,
  onDeleteNotes,
  onDeleteCode,
  onDeleteCodes,
  onDeleteWorkspace,
}) {
  const { confirm } = useAppFeedback();
  const [listMode, setListMode] = useState("notes");
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("updated");
  const [selectedIds, setSelectedIds] = useState([]);
  const canInteract = !isLoadingNotes;

  const items = listMode === "notes" ? notes : codes;
  const pinnedIds = listMode === "notes" ? pinnedNoteIds : pinnedCodeIds;
  const activeId = listMode === "notes" ? activeNoteId : activeCodeId;
  const activeIsDirty = listMode === "notes" ? isDirty : isCodeDirty;
  const pinnedSet = useMemo(() => new Set(pinnedIds ?? []), [pinnedIds]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => items.some((item) => item._id === id))
    );
  }, [items]);

  useEffect(() => {
    setEditingId(null);
    setDraftTitle("");
    setSelectedIds([]);
    setSearchTerm("");
  }, [listMode]);

  const visibleItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const filtered = normalized
      ? items.filter((item) => {
          const title = item.title ?? "";
          const body =
            listMode === "notes" ? item.content ?? "" : item.code ?? "";
          return `${title} ${body}`.toLowerCase().includes(normalized);
        })
      : items;

    const compareItems = (a, b) => {
      if (sortKey === "title") {
        const titleA = (a.title ?? "Untitled").toLowerCase();
        const titleB = (b.title ?? "Untitled").toLowerCase();
        return titleA.localeCompare(titleB);
      }

      const getTimestamp = (item, key) => {
        const value = item[key] ?? item.createdAt ?? 0;
        return new Date(value).getTime();
      };

      if (sortKey === "created") {
        return getTimestamp(b, "createdAt") - getTimestamp(a, "createdAt");
      }

      return getTimestamp(b, "updatedAt") - getTimestamp(a, "updatedAt");
    };

    const pinned = filtered.filter((item) => pinnedSet.has(item._id));
    const unpinned = filtered.filter((item) => !pinnedSet.has(item._id));

    return [...pinned.sort(compareItems), ...unpinned.sort(compareItems)];
  }, [items, listMode, pinnedSet, searchTerm, sortKey]);

  const startEditing = (item) => {
    setEditingId(item._id);
    setDraftTitle(item.title ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftTitle("");
  };

  const commitEditing = async (item) => {
    const nextTitle = draftTitle.trim();
    if (listMode === "notes") {
      await onRenameNote(item._id, nextTitle);
    } else {
      await onRenameCode(item._id, nextTitle);
    }
    cancelEditing();
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirmDeletes) {
      const ok = await confirm({
        title: `Delete ${selectedIds.length} selected ${listMode}?`,
        message:
          listMode === "notes"
            ? "The selected notes will be removed from this workspace."
            : "The selected code entries will be removed from this workspace.",
        confirmLabel: "Delete selected",
        cancelLabel: "Keep items",
        tone: "danger",
      });
      if (!ok) return;
    }
    if (listMode === "notes") {
      await onDeleteNotes(selectedIds);
    } else {
      await onDeleteCodes(selectedIds);
    }
    setSelectedIds([]);
  };

  const placeholder = listMode === "notes" ? "Search notes" : "Search code";
  const emptyLabel =
    items.length === 0
      ? `No ${listMode} yet.`
      : "No matching results. Try a different keyword.";
  const itemCountLabel = `${listMode === "notes" ? notes.length : codes.length} in view`;
  const sortLabel =
    sortKey === "updated"
      ? "Recently updated"
      : sortKey === "created"
      ? "Newest first"
      : "Title A-Z";
  const workspaceTitle = workspace.workspaceName?.trim() || workspace.workspaceId;
  const workspaceIdLabel = workspace.workspaceId;

  return (
    <div className="motion-slide-left-in panel flex h-full w-full flex-col gap-4 p-4 md:py-5 md:pl-5 md:pr-7">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="section-kicker">Workspace Library</p>
            <h3
              className="truncate text-[1.6rem] font-semibold tracking-[-0.03em] text-slate-900"
              title={workspaceTitle}
            >
              {workspaceTitle}
            </h3>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
              Workspace ID {workspaceIdLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              One place for drafts, snippets, and the next thing you need to reopen fast.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="ui-chip">{itemCountLabel}</span>
            {onCollapse ? (
              <button
                type="button"
                className="icon-button hidden md:grid h-9 w-9"
                onClick={onCollapse}
                title="Collapse sidebar list"
                aria-label="Collapse sidebar list"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="ui-chip">{notes.length} notes</span>
          <span className="ui-chip">{codes.length} code</span>
          <span className="ui-chip">{sortLabel}</span>
          {selectedIds.length > 0 ? (
            <span className="ui-chip">{selectedIds.length} selected</span>
          ) : null}
        </div>
      </div>

      <div className="panel-inset p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border border-[rgba(104,84,58,0.14)] bg-white/45 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition library-tab-btn ${
                  listMode === "notes"
                    ? "active bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)] text-white shadow-[0_14px_28px_rgba(149,81,35,0.22)]"
                    : "text-slate-700 hover:bg-white/70"
                }`}
                onClick={() => setListMode("notes")}
                disabled={!canInteract}
              >
                Notes
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition library-tab-btn ${
                  listMode === "codes"
                    ? "active bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)] text-white shadow-[0_14px_28px_rgba(149,81,35,0.22)]"
                    : "text-slate-700 hover:bg-white/70"
                }`}
                onClick={() => setListMode("codes")}
                disabled={!canInteract}
              >
                Code
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-primary px-4"
              onClick={() => {
                setListMode("notes");
                onCreateNote();
              }}
              disabled={!canInteract}
            >
              New Note
            </button>
            <button
              className="btn btn-soft px-4"
              onClick={() => {
                setListMode("codes");
                onCreateCode();
              }}
              disabled={!canInteract}
            >
              New Code
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
          <input
            className="input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={placeholder}
          />

          <SidebarSortSelect
            label="Sort Library"
            value={sortKey}
            options={SORT_OPTIONS}
            onChange={setSortKey}
            disabled={!canInteract}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Pinned entries stay at the top of the list
          </p>
          <button
            className="btn btn-danger px-4 py-2 text-xs"
            onClick={deleteSelected}
            disabled={!canInteract || selectedIds.length === 0}
            title="Delete selected items"
          >
            Delete Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
        </div>
      </div>

      <div className="panel-inset min-h-0 flex-1 overflow-hidden p-2">
        <ul className="motion-stagger h-full space-y-2 overflow-y-auto pr-1">
          {isLoadingNotes ? (
            <li className="panel-muted p-4 text-sm text-slate-500">Loading...</li>
          ) : visibleItems.length === 0 ? (
            <li className="panel-muted p-4 text-sm text-slate-500">{emptyLabel}</li>
          ) : (
            visibleItems.map((item) => {
            const isActive = item._id === activeId;
            const showDirty = isActive && activeIsDirty;
            const isPinned = pinnedSet.has(item._id);
            const body = listMode === "notes" ? item.content ?? "" : item.code ?? "";
            const preview = body.replace(/\s+/g, " ").trim() || "No preview yet.";

            return (
              <li
                key={item._id}
                className={`motion-soft-pop relative overflow-hidden rounded-[1.5rem] border p-4 md:p-4.5 transition library-item ${
                  isActive
                    ? "library-item-active border-[rgba(188,116,65,0.12)] bg-[linear-gradient(135deg,rgba(242,218,193,0.22)_0%,rgba(255,255,255,0.78)_100%)] shadow-[0_12px_28px_rgba(149,81,35,0.08)]"
                    : "border-transparent bg-white/35 hover:border-[rgba(104,84,58,0.12)] hover:bg-white/60"
                }`}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-[var(--tp-accent)]"
                  />
                ) : null}

                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item._id)}
                    onChange={() => toggleSelection(item._id)}
                    disabled={!canInteract}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />

                  {editingId === item._id ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void commitEditing(item);
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelEditing();
                          }
                        }}
                        placeholder="Untitled"
                        className="input"
                        disabled={!canInteract}
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary px-3 py-2 text-xs"
                          onClick={() => commitEditing(item)}
                          disabled={!canInteract}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-ghost px-3 py-2 text-xs"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (listMode === "notes") {
                            onSelectNote(item);
                          } else {
                            onSelectCode(item);
                          }
                        }}
                        title={item.title || "Untitled"}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`truncate text-sm ${
                              isActive
                                ? "font-semibold text-slate-900"
                                : "font-semibold text-slate-800"
                            }`}
                          >
                            {item.title?.trim() || "Untitled"}
                          </p>
                          {showDirty ? (
                            <span
                              className="h-2 w-2 rounded-full bg-[var(--tp-accent)]"
                              title="Unsaved changes"
                            />
                          ) : null}
                          {isPinned ? <span className="pill">Pinned</span> : null}
                        </div>
                        <p className="mt-2.5 max-h-12 overflow-hidden text-sm leading-6 text-slate-500">
                          {preview}
                        </p>
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {formatDateLabel(item.updatedAt)}
                        </p>
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="icon-button h-9 w-9"
                          onClick={() => startEditing(item)}
                          disabled={!canInteract}
                          title="Rename"
                          aria-label="Rename"
                          type="button"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>

                        <button
                          className="icon-button h-9 w-9"
                          onClick={() => {
                            if (listMode === "notes") {
                              onTogglePin(item._id);
                            } else {
                              onTogglePinCode(item._id);
                            }
                          }}
                          disabled={!canInteract}
                          title={isPinned ? "Unpin" : "Pin"}
                          aria-label={isPinned ? "Unpin" : "Pin"}
                          type="button"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 17v5" />
                            <path d="M9 3h6l1 7 2 2v2H6v-2l2-2 1-7z" />
                          </svg>
                        </button>

                        <button
                          className="grid h-9 w-9 place-items-center rounded-full text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          onClick={async () => {
                            const label = item.title ? `"${item.title}"` : "this item";
                            if (confirmDeletes) {
                              const ok = await confirm({
                                title: `Delete ${label}?`,
                                message:
                                  listMode === "notes"
                                    ? "This note will be removed from the workspace."
                                    : "This code entry will be removed from the workspace.",
                                confirmLabel: "Delete",
                                cancelLabel: "Keep it",
                                tone: "danger",
                              });
                              if (!ok) return;
                            }
                            if (listMode === "notes") {
                              onDeleteNote(item._id);
                            } else {
                              onDeleteCode(item._id);
                            }
                          }}
                          disabled={!canInteract}
                          title="Delete"
                          aria-label="Delete"
                          type="button"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
            })
          )}
        </ul>
      </div>

      <div className="grid gap-3 border-t border-[rgba(104,84,58,0.12)] pt-3 md:pr-1">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Workspace-wide action
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Remove the entire workspace only when you are done with everything inside it.
          </p>
        </div>
        <button
          className="btn btn-danger min-w-0 w-full justify-center px-4"
          onClick={() => {
            void onDeleteWorkspace();
          }}
          disabled={!canInteract}
        >
          Delete Workspace
        </button>
      </div>
    </div>
  );
}
