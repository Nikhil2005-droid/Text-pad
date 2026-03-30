export default function DocsPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Documentation
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">How It Works</h2>
        <p className="mt-3 text-slate-600">
          Text-pad is a workspace-based notes + code scratchpad. The key idea is
          simple: selecting a workspace automatically loads everything inside it.
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Data flow contract</p>
          <p className="mt-1">
            Workspace selection is the only trigger for loading notes/codes. The UI
            reacts to state changes (not button clicks) so data always feels
            predictable.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Workspaces</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Open a workspace with a 3+ character workspace ID.</li>
            <li>Press Enter to open (no mouse required).</li>
            <li>Workspace ID input supports show/hide (password-style).</li>
            <li>
              Workspace protection can be enabled later from Settings with an
              optional password.
            </li>
            <li>
              Protected workspaces ask for the workspace password before they
              open.
            </li>
            <li>
              Workspace selection triggers loading notes + code entries
              automatically.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Navigation</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Routes: Workspace, Docs, Settings.</li>
            <li>
              A back button appears in the navbar after opening a workspace.
            </li>
            <li>
              Leaving the workspace editor auto-saves your draft to avoid losing
              changes.
            </li>
            <li>
              Returning to a protected workspace reopens the password gate
              before the workspace content loads.
            </li>
            <li>Navbar is sticky; footer sits inside the page layout.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Create unlimited notes per workspace.</li>
            <li>Save and Finish and Save (finish clears the editor view).</li>
            <li>Unsaved changes show a * next to the active note in the list.</li>
            <li>Word count + last saved timestamp in the editor.</li>
            <li>Optional ruled paper lines for a notebook feel.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Code</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Create multiple code entries (like notes) inside a workspace.</li>
            <li>Line numbers included, with scroll sync.</li>
            <li>Save + Finish (finish clears the code editor view).</li>
            <li>Works with search, sort, pin, rename, delete.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Sidebar List</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Switch between Notes and Code lists.</li>
            <li>Search by title + content.</li>
            <li>Sort by recently updated, newest, or title A-Z.</li>
            <li>Pin important items (pinned items show first).</li>
            <li>Rename, delete, multi-select delete, and undo restore.</li>
            <li>Scrollable list for large workspaces.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Productivity Features
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>
              Auto-replace sequences while typing (ex: -&gt; becomes →, &lt;=
              becomes ≤, != becomes ≠).
            </li>
            <li>Keyboard shortcuts in the note editor:</li>
            <li>Ctrl/Cmd + S: Save</li>
            <li>Ctrl/Cmd + N: New note</li>
            <li>Esc: Finish and Save (when a note is open)</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>
              Preferences are saved inside your workspace and apply next time you
              open it.
            </li>
            <li>Auto-replace symbols: on/off.</li>
            <li>Ruled lines in notes: on/off.</li>
            <li>Confirm before delete: on/off.</li>
            <li>Show autosave toasts: on/off.</li>
            <li>Modify Workspace: rename workspace ID (3+ characters).</li>
            <li>
              Workspace Protection: set, change, or remove a workspace password.
            </li>
            <li>
              After protection is enabled, Settings shows that the workspace is
              protected.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Storage Notes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>
              Server stores: workspace, notes, code entries, and workspace
              preferences.
            </li>
            <li>
              Browser stores: pinned items per workspace and desktop sidebar
              width.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
