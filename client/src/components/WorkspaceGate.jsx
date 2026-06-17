import { useState } from "react";
import { Link } from "react-router-dom";

const workflowSteps = [
  {
    title: "Open once",
    copy: "Use a simple workspace ID to pull your editing space back in.",
  },
  {
    title: "Keep both modes together",
    copy: "Notes and code live in the same workspace without context switching.",
  },
  {
    title: "Leave safely",
    copy: "Autosave and finish flows help you leave without losing your draft.",
  },
];

const highlights = [
  { label: "One workspace", value: "Notes + code together" },
  { label: "Fast flow", value: "Keyboard-first editing" },
  { label: "Private option", value: "Password protection" },
];

const supportCards = [
  {
    kicker: "Capture",
    title: "Keep scratch work in one place",
    copy: "Turn a workspace into a project board instead of juggling temporary tabs.",
  },
  {
    kicker: "Security",
    title: "Protect only when needed",
    copy: "Personal spaces stay fast, while sensitive ones can require a password.",
  },
];

const quickReentryDetails = [
  { label: "Preferences", value: "Saved per workspace" },
  { label: "Pinned items", value: "Stay exactly where you left them" },
  { label: "Editor feel", value: "Typography and structure return with you" },
];

function formatRecentOpenedLabel(value) {
  if (!value) return "Opened recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Opened recently";
  }

  return `Opened ${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}`;
}

function RecentStudioCard({ studio, onOpen, onRemove }) {
  return (
    <div className="motion-soft-pop group relative min-w-[220px] max-w-[260px] shrink-0 overflow-hidden rounded-[1.6rem] border border-white/50 bg-[linear-gradient(145deg,rgba(255,255,255,0.72)_0%,rgba(242,226,210,0.54)_100%)] p-5 md:p-5.5 shadow-[0_20px_42px_rgba(76,58,38,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(76,58,38,0.12)]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => onOpen?.(studio)}
        aria-label={`Open ${studio.workspaceName}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-kicker">Recent Studio</p>
          <h3
            className="mt-2 truncate text-lg font-semibold text-slate-900"
            title={studio.workspaceName}
          >
            {studio.workspaceName}
          </h3>
          <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-slate-400">
            {studio.workspaceId}
          </p>
        </div>

        <button
          type="button"
          className="icon-button relative z-10 h-9 w-9 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.(studio.workspaceId);
          }}
          aria-label={`Remove ${studio.workspaceName} from recent studios`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="ui-chip">{formatRecentOpenedLabel(studio.lastOpenedAt)}</span>
        {studio.isPasswordProtected ? <span className="ui-chip">Password</span> : null}
      </div>
    </div>
  );
}

export default function WorkspaceGate({
  workspaceId,
  setWorkspaceId,
  workspacePassword,
  setWorkspacePassword,
  requiresWorkspacePassword,
  workspaceOpenError,
  recentWorkspaces = [],
  onOpen,
  onOpenRecent,
  onRemoveRecent,
}) {
  const [isWorkspaceIdVisible, setIsWorkspaceIdVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const trimmedId = workspaceId.trim();
  const isValid = trimmedId.length >= 3;
  const canSubmit =
    isValid && (!requiresWorkspacePassword || workspacePassword.length > 0);

  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
      <aside className="motion-rise-in order-1 space-y-4 lg:order-2 lg:sticky lg:top-28">
        <section className="panel p-6 md:p-7.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-kicker">Open Workspace</p>
            <span className="ui-chip">Visible right away</span>
          </div>

          <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">
            Jump straight back in
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter your workspace details here and reopen your notes and code
            without scrolling past the intro first.
          </p>

          <div className="mt-5 w-full space-y-3">
            <div className="relative">
              <input
                placeholder="Workspace ID"
                type={isWorkspaceIdVisible ? "text" : "password"}
                value={workspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  if (isValid) onOpen();
                }}
                autoComplete="off"
                className="input pr-12"
              />
              <button
                type="button"
                onClick={() => setIsWorkspaceIdVisible((prev) => !prev)}
                aria-label={
                  isWorkspaceIdVisible
                    ? "Hide workspace ID"
                    : "Show workspace ID"
                }
                className="icon-button absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
              >
                {isWorkspaceIdVisible ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="3" y1="3" x2="21" y2="21" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {requiresWorkspacePassword ? (
              <div className="space-y-2">
                <p className="rounded-2xl border border-[rgba(104,84,58,0.12)] bg-white/55 px-4 py-3 text-sm text-slate-600">
                  This workspace is protected. Enter the password to unlock the
                  editor.
                </p>
                <div className="relative">
                  <input
                    placeholder="Workspace password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={workspacePassword}
                    onChange={(event) =>
                      setWorkspacePassword(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (canSubmit) onOpen();
                    }}
                    autoComplete="current-password"
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    aria-label={
                      isPasswordVisible
                        ? "Hide workspace password"
                        : "Show workspace password"
                    }
                    className="icon-button absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
                  >
                    {isPasswordVisible ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                  >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                        <line x1="3" y1="3" x2="21" y2="21" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {!isValid && trimmedId.length > 0 ? (
              <p className="text-sm text-rose-600">
                Workspace ID must be at least 3 characters.
              </p>
            ) : null}
            {workspaceOpenError && isValid ? (
              <p className="text-sm text-rose-600">{workspaceOpenError}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                className="btn btn-primary min-w-[168px]"
                onClick={onOpen}
                disabled={!canSubmit}
              >
                {requiresWorkspacePassword
                  ? "Unlock Workspace"
                  : "Open Workspace"}
              </button>
              <Link className="btn btn-soft px-4" to="/docs">
                Read Docs
              </Link>
            </div>

            <div className="rounded-[1.35rem] border border-[rgba(104,84,58,0.12)] bg-white/55 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              Press Enter after typing your workspace details
            </div>
          </div>
        </section>

        <div className="motion-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {supportCards.map((card) => (
            <article key={card.title} className="panel-muted p-4">
              <p className="section-kicker">{card.kicker}</p>
              <h3 className="font-display mt-2 text-xl font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.copy}
              </p>
            </article>
          ))}
        </div>
      </aside>

      <section className="motion-scale-in panel order-2 overflow-hidden p-6 md:p-8 lg:order-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="section-kicker">Workspace Access</p>
          <span className="ui-chip">Notes, code, one home</span>
        </div>

        <h1 className="font-display mt-4 max-w-3xl text-4xl font-semibold leading-none text-slate-900 md:text-5xl">
          Enter Your Workspace
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
          Shape your workspace once, then step back into it anytime.
        </p>

        {recentWorkspaces.length > 0 ? (
          <div className="panel-inset mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Recent Studios</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Reopen a workspace in one tap. Protected studios will ask for the password next.
                </p>
              </div>
              <span className="ui-chip">{recentWorkspaces.length} saved</span>
            </div>

            <div className="motion-stagger mt-4 flex gap-3 overflow-x-auto pb-2 pr-1">
              {recentWorkspaces.map((studio) => (
                <RecentStudioCard
                  key={studio.workspaceId}
                  studio={studio}
                  onOpen={onOpenRecent}
                  onRemove={onRemoveRecent}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {highlights.map((item) => (
            <span key={item.label} className="ui-chip">
              <span className="text-slate-400">{item.label}</span>
              <span className="text-slate-700">{item.value}</span>
            </span>
          ))}
        </div>

        <div className="motion-stagger mt-8 grid gap-3 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <article
              key={step.title}
              className="panel-muted flex h-full flex-col gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(188,116,65,0.12)] text-sm font-semibold text-[var(--tp-accent-strong)]">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm leading-6 text-slate-600">{step.copy}</p>
            </article>
          ))}
        </div>

        <div className="motion-rise-in panel-inset mt-6 grid gap-5 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] md:p-6">
          <div className="max-w-2xl">
            <p className="section-kicker">Quick Re-entry</p>
            <h3 className="font-display mt-2 text-2xl font-semibold text-slate-900">
              Resume work without rebuilding context
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Text Pad quietly keeps the workspace details that matter, so reopening
              feels like returning to a desk that is already arranged for you.
            </p>
          </div>

          <div className="space-y-2">
            {quickReentryDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.2rem] border border-[rgba(104,84,58,0.12)] bg-white/58 px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
