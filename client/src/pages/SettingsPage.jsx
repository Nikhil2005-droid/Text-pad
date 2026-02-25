import { useEffect, useState } from "react";
import { useWorkspace } from "../hooks/useWorkspace";

export default function SettingsPage() {
  const { workspace, renameWorkspace, updatePreferences } = useWorkspace();
  const [draftName, setDraftName] = useState("");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    setDraftName(workspace?.workspaceId ?? "");
  }, [workspace?.workspaceId]);

  const prefs = workspace?.preferences ?? {};
  const autoReplaceEnabled = prefs.autoReplace ?? true;
  const ruledNotesEnabled = prefs.ruledNotes ?? true;
  const confirmDeletes = prefs.confirmDeletes ?? true;
  const showAutosaveToasts = prefs.showAutosaveToasts ?? false;

  const setPref = async (key, value) => {
    if (!workspace) return;
    setIsSavingPrefs(true);
    await updatePreferences({ [key]: value });
    setIsSavingPrefs(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Settings
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Preferences
        </h2>
        <p className="mt-3 text-slate-600">
          These settings are saved inside your current workspace and will apply
          the next time you open it.
        </p>

        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Auto-replace symbols</p>
                <p className="mt-1 text-xs text-slate-500">
                  Replaces sequences like -&gt;, &lt;=, != with →, ≤, ≠ while typing.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoReplaceEnabled}
                disabled={!workspace || isSavingPrefs}
                onClick={() => setPref("autoReplace", !autoReplaceEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  autoReplaceEnabled ? "bg-slate-900" : "bg-slate-200"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    autoReplaceEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Ruled lines in notes</p>
                <p className="mt-1 text-xs text-slate-500">
                  Shows notebook lines behind the note editor.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={ruledNotesEnabled}
                disabled={!workspace || isSavingPrefs}
                onClick={() => setPref("ruledNotes", !ruledNotesEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  ruledNotesEnabled ? "bg-slate-900" : "bg-slate-200"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    ruledNotesEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Confirm before delete</p>
                <p className="mt-1 text-xs text-slate-500">
                  Asks before deleting notes/codes from the list.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={confirmDeletes}
                disabled={!workspace || isSavingPrefs}
                onClick={() => setPref("confirmDeletes", !confirmDeletes)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  confirmDeletes ? "bg-slate-900" : "bg-slate-200"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    confirmDeletes ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Show autosave toasts</p>
                <p className="mt-1 text-xs text-slate-500">
                  Shows “Saved note/code” when switching items or leaving the workspace.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showAutosaveToasts}
                disabled={!workspace || isSavingPrefs}
                onClick={() => setPref("showAutosaveToasts", !showAutosaveToasts)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  showAutosaveToasts ? "bg-slate-900" : "bg-slate-200"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    showAutosaveToasts ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {!workspace ? (
            <p className="text-sm text-slate-500">
              Open a workspace first to edit its preferences.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Modify Workspace
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Rename the current workspace ID (this changes how you open it).
        </p>
        <div className="mt-4 space-y-3">
          <input
            className="input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="New workspace ID"
            disabled={!workspace}
          />
          <button
            className="btn btn-primary"
            disabled={!workspace}
            onClick={() => renameWorkspace(draftName)}
          >
            Save Workspace ID
          </button>
          {!workspace ? (
            <p className="text-sm text-slate-500">
              Open a workspace first to edit its settings.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
