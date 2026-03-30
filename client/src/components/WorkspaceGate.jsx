import { useState } from "react";
import { Link } from "react-router-dom";

export default function WorkspaceGate({
  workspaceId,
  setWorkspaceId,
  workspacePassword,
  setWorkspacePassword,
  requiresWorkspacePassword,
  workspaceOpenError,
  onOpen,
}) {
  const [isWorkspaceIdVisible, setIsWorkspaceIdVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const trimmedId = workspaceId.trim();
  const isValid = trimmedId.length >= 3;
  const canSubmit = isValid && (!requiresWorkspacePassword || workspacePassword.length > 0);

  return (
    <div className="w-full space-y-4 md:space-y-5">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur tp-enter tp-enter-1 transition-transform hover:-translate-y-0.5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Open Workspace
          </h2>
          <p className="text-sm text-slate-500">
            Enter your workspace ID to load notes.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <input
              placeholder="Workspace ID"
              type={isWorkspaceIdVisible ? "text" : "password"}
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
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
                isWorkspaceIdVisible ? "Hide workspace ID" : "Show workspace ID"
              }
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
              <p className="text-sm text-slate-600">
                This workspace is protected. Enter its password to continue.
              </p>
              <div className="relative">
                <input
                  placeholder="Workspace password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={workspacePassword}
                  onChange={(event) => setWorkspacePassword(event.target.value)}
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
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
            <p className="text-sm text-rose-500">
              Workspace ID must be at least 3 characters.
            </p>
          ) : null}
          {workspaceOpenError && isValid ? (
            <p className="text-sm text-rose-500">{workspaceOpenError}</p>
          ) : null}

          <button
            className="btn btn-primary w-full"
            onClick={onOpen}
            disabled={!canSubmit}
          >
            {requiresWorkspacePassword ? "Unlock Workspace" : "Open Workspace"}
          </button>
        </div>
      </div>

      <section className="w-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur tp-enter tp-enter-2 transition-transform hover:-translate-y-0.5 md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Welcome
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">
                Write notes. Store code. Stay in one workspace.
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Open a workspace and your notes + code entries load automatically.
                No &quot;refresh&quot; buttons - the UI reacts to workspace state.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="btn btn-ghost" to="/docs">
                Read Docs
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-8 select-none text-[80px] font-black leading-none text-slate-900/5 md:-top-10 md:text-[88px]"
              >
                1
              </span>
              <p className="relative text-sm font-semibold text-slate-900">
                Open a workspace
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-8 select-none text-[80px] font-black leading-none text-slate-900/5 md:-top-10 md:text-[88px]"
              >
                2
              </span>
              <p className="relative text-sm font-semibold text-slate-900">
                Create notes or code
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-8 select-none text-[80px] font-black leading-none text-slate-900/5 md:-top-10 md:text-[88px]"
              >
                3
              </span>
              <p className="relative text-sm font-semibold text-slate-900">
                Finish confidently
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
