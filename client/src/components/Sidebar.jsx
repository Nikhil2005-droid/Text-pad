import { useEffect, useMemo, useState } from "react";

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
  const [listMode, setListMode] = useState("notes"); // notes | codes
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

  const pinnedSet = useMemo(() => new Set(pinnedIds ?? []), [pinnedIds]);

  const truncateTitle = (text, max = 5) => {
    const value = (text ?? "").trim();
    if (value.length <= max) return value || "Untitled";
    return `${value.slice(0, max)}...`;
  };

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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirmDeletes) {
      const ok = window.confirm(`Delete ${selectedIds.length} selected ${listMode}?`);
      if (!ok) return;
    }
    if (listMode === "notes") {
      await onDeleteNotes(selectedIds);
    } else {
      await onDeleteCodes(selectedIds);
    }
    setSelectedIds([]);
  };

  const placeholder =
    listMode === "notes" ? "Search notes" : "Search code";

  return (
    <div className="flex h-full w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl backdrop-blur">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Workspace
        </p>
        <h3
          className="truncate text-lg font-semibold text-slate-900"
          title={workspace.workspaceName || workspace.workspaceId}
        >
          {workspace.workspaceName || workspace.workspaceId}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            setListMode("notes");
            onCreateNote();
          }}
          disabled={!canInteract}
        >
          New Note
        </button>
        <button
          className="btn btn-soft"
          onClick={() => {
            setListMode("codes");
            onCreateCode();
          }}
          disabled={!canInteract}
        >
          New Code
        </button>
        <button
          className="btn btn-danger"
          onClick={deleteSelected}
          disabled={!canInteract || selectedIds.length === 0}
        >
          Delete Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
        </button>
        <button className="btn btn-soft" onClick={onDeleteWorkspace} disabled={!canInteract}>
          Delete Workspace
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`btn flex-1 ${listMode === "notes" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setListMode("notes")}
          disabled={!canInteract}
        >
          Notes
        </button>
        <button
          className={`btn flex-1 ${listMode === "codes" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setListMode("codes")}
          disabled={!canInteract}
        >
          Codes
        </button>
      </div>

      <div className="space-y-2">
        <input
          className="input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={placeholder}
        />

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Sort
          </label>
          <select
            className="input mt-1"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="created">Newest first</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {isLoadingNotes ? (
          <li className="rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            Loading...
          </li>
        ) : visibleItems.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            {items.length === 0 ? `No ${listMode} yet.` : "No matching results."}
          </li>
        ) : (
          visibleItems.map((item) => {
            const isActive = item._id === activeId;
            const showDirty = isActive && activeIsDirty;
            const isPinned = pinnedSet.has(item._id);

            return (
              <li
                key={item._id}
                className={`group relative flex min-h-[44px] w-full items-center gap-2 rounded-2xl border px-3 py-2 transition ${
                  isActive
                    ? "border-slate-900/10 bg-slate-900/5"
                    : "border-transparent hover:border-slate-200 hover:bg-white/80"
                }`}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-slate-900/40"
                  />
                ) : null}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item._id)}
                  onChange={() => toggleSelection(item._id)}
                  disabled={!canInteract}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />

                {editingId === item._id ? (
                  <div className="flex flex-1 items-center gap-2">
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
                      className="input h-9 flex-1"
                      disabled={!canInteract}
                    />
                    <button
                      className="btn btn-primary shrink-0 whitespace-nowrap px-2 py-1 text-xs"
                      onClick={() => commitEditing(item)}
                      disabled={!canInteract}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-ghost shrink-0 whitespace-nowrap px-2 py-1 text-xs"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => {
                      if (listMode === "notes") {
                        onSelectNote(item);
                      } else {
                        onSelectCode(item);
                      }
                    }}
                    title={item.title || "Untitled"}
                    className={`min-w-0 flex flex-1 cursor-pointer items-center gap-2 text-sm ${
                      isActive ? "font-semibold text-slate-900" : "text-slate-700"
                    }`}
                  >
                    <span className="truncate">{truncateTitle(item.title)}</span>
                    {showDirty ? (
                      <span title="Unsaved changes" className="text-slate-900">
                        *
                      </span>
                    ) : null}
                    {isPinned ? <span className="pill">Pinned</span> : null}
                  </span>
                )}

                {editingId === item._id ? null : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
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
                      className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
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
                    onClick={() => {
                      const label = item.title ? `"${item.title}"` : "this item";
                      if (confirmDeletes) {
                        const ok = window.confirm(`Delete ${label}?`);
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
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
