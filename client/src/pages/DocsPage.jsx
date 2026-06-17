import { useState } from "react";
import { useWorkspace } from "../hooks/useWorkspace";

const docSections = [
  {
    title: "Workspaces",
    items: [
      "Open a workspace with a 3+ character workspace ID.",
      "Workspace titles and workspace IDs are separate: the title is what you see, the ID is what you type to reopen.",
      "Press Enter to open without leaving the keyboard.",
      "Workspace protection can be added later from Settings.",
      "Protected workspaces ask for a password before they open.",
      "Opening a workspace automatically loads its notes and code entries.",
    ],
  },
  {
    title: "Navigation",
    items: [
      "Routes include Workspace, Docs, and Settings.",
      "A back button appears in the navbar after opening a workspace.",
      "Leaving the editor auto-saves drafts to reduce accidental loss.",
      "Returning to a protected workspace re-locks the content first.",
      "The navbar stays sticky while the layout keeps the footer anchored.",
    ],
  },
  {
    title: "Notes",
    items: [
      "Create unlimited notes per workspace.",
      "Save and Finish clears the active editor view after saving.",
      "Unsaved note changes are marked in the sidebar.",
      "Word count and last-saved timing stay visible while writing.",
      "Drag the lower edge of the note area downward to make more writing space.",
      "Switch between three note fonts directly from the Note Studio dropdown.",
      "Ruled paper lines can be enabled for a notebook feel.",
    ],
  },
  {
    title: "Code",
    items: [
      "Create multiple code entries inside the same workspace.",
      "Line numbers stay synced while the editor scrolls.",
      "Save and Finish works the same way as notes.",
      "Switch between three code fonts directly from the Code Studio dropdown.",
      "Code entries support search, sort, pin, rename, and delete.",
    ],
  },
  {
    title: "Sidebar List",
    items: [
      "Switch between Notes and Code views.",
      "Search across titles and body content.",
      "Sort by recently updated, newest, or title A-Z.",
      "Pin important items so they stay at the top.",
      "Rename, delete, multi-select delete, and undo restore.",
    ],
  },
  {
    title: "Productivity",
    items: [
      "Auto-replace typing shortcuts like ->, <=, and !=.",
      "Ctrl/Cmd + S saves the active note.",
      "Ctrl/Cmd + N creates a new note.",
      "Esc finishes and saves the active note.",
    ],
  },
  {
    title: "Settings",
    items: [
      "Preferences are saved inside the current workspace.",
      "Toggle symbol replacement, ruled notes, delete confirmation, and autosave toasts.",
      "Change the workspace title from Settings or the navbar menu without changing the reopen ID.",
      "Rename the workspace ID separately when you want a new reopen key.",
      "Set, change, or remove workspace password protection.",
    ],
  },
  {
    title: "Storage Notes",
    items: [
      "The server stores the workspace, notes, code entries, and preferences.",
      "The browser stores pinned items per workspace and desktop sidebar width.",
    ],
  },
];

function InlineWorkspacePreferenceCard({
  title,
  description,
  checked,
  disabled,
  statusLabel,
  onToggle,
}) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-[rgba(104,84,58,0.12)] bg-white/70 p-5 md:p-5.5 shadow-[0_18px_36px_rgba(76,58,38,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="section-kicker">Live Control</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition ${
            checked
              ? "border-[rgba(149,81,35,0.22)] bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)]"
              : "border-[rgba(104,84,58,0.14)] bg-white/70"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
              checked ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
        {statusLabel}
      </p>
    </div>
  );
}

export default function DocsPage() {
  const { workspace, updatePreferences } = useWorkspace();
  const [savingPreferenceKey, setSavingPreferenceKey] = useState("");
  const autoReplaceEnabled = workspace?.preferences?.autoReplace ?? true;

  const handleToggleAutoReplace = async () => {
    if (!workspace || savingPreferenceKey) return;
    setSavingPreferenceKey("autoReplace");
    try {
      await updatePreferences({ autoReplace: !autoReplaceEnabled });
    } finally {
      setSavingPreferenceKey("");
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="panel p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Documentation</p>
            <h1 className="font-display mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
              How Text Pad behaves, page by page
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Text Pad is a workspace-based notes and code scratchpad. The key
              rule is simple: workspace selection drives the rest of the app, so
              every view reacts to state instead of random button side effects.
            </p>
          </div>

          <div className="panel-muted max-w-sm p-4">
            <p className="section-kicker">Data Flow</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Workspace selection is the only trigger for loading notes and code
              entries. That keeps navigation predictable and reduces stale UI.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {docSections.map((section) => (
          <article key={section.title} className="panel-muted p-5">
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {section.title}
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tp-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {section.title === "Productivity" ? (
              <InlineWorkspacePreferenceCard
                title="Auto-replace typing shortcuts"
                description="Turn symbol replacement on or off here while you read about it. The change is saved straight into the active workspace."
                checked={autoReplaceEnabled}
                disabled={!workspace || savingPreferenceKey === "autoReplace"}
                statusLabel={
                  workspace
                    ? `Workspace ${autoReplaceEnabled ? "has" : "does not have"} auto-replace enabled`
                    : "Open a workspace to control this setting here"
                }
                onToggle={handleToggleAutoReplace}
              />
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
