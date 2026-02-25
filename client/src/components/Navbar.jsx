import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useWorkspace } from "../hooks/useWorkspace";

const baseNavItems = [
  { to: "/", label: "Workspace" },
  { to: "/docs", label: "Docs" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [draftWorkspaceId, setDraftWorkspaceId] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const workspaceMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { workspace, renameWorkspace, closeWorkspace, runWorkspaceSaveHandler } =
    useWorkspace();
  const workspaceLabel =
    workspace?.workspaceName || workspace?.workspaceId || "No workspace";
  const hasWorkspace = !!workspace?.workspaceId;
  const isWorkspacePage =
    location.pathname === "/" || location.pathname === "/workspace";
  const showWorkspaceBackButton = hasWorkspace;
  const backButtonText = isWorkspacePage ? "Workspaces" : "Back";
  const backButtonLabel = isWorkspacePage
    ? "Back to workspace gate"
    : "Back to workspace";
  useEffect(() => {
    setDraftWorkspaceId(workspace?.workspaceId ?? "");
  }, [workspace?.workspaceId]);

  useEffect(() => {
    if (!isWorkspaceMenuOpen) return;
    const handlePointerDown = (event) => {
      if (!workspaceMenuRef.current) return;
      if (workspaceMenuRef.current.contains(event.target)) return;
      setIsWorkspaceMenuOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isWorkspaceMenuOpen]);

  const handleRename = async () => {
    if (!hasWorkspace) return;
    const nextId = draftWorkspaceId.trim();
    if (nextId.length < 3) return;

    setIsRenaming(true);
    const data = await renameWorkspace(nextId);
    setIsRenaming(false);

    if (data) {
      setIsWorkspaceMenuOpen(false);
    }
  };

  const goTo = async (to) => {
    setIsOpen(false);
    setIsWorkspaceMenuOpen(false);

    // If we're leaving the workspace editor route, autosave first to avoid losing drafts.
    const isLeavingWorkspaceRoute =
      isWorkspacePage && !(to === "/" || to === "/workspace");
    if (hasWorkspace && isLeavingWorkspaceRoute) {
      const ok = await runWorkspaceSaveHandler();
      if (!ok) return;
    }

    navigate(to);
  };

  return (
    <header className="sticky top-0 z-30 px-4 pt-2.5 md:px-8">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            {showWorkspaceBackButton ? (
              <button
                type="button"
                className="group flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                onClick={async () => {
                  setIsOpen(false);
                  setIsWorkspaceMenuOpen(false);

                  // On the workspace page: back closes the active workspace (returns to gate).
                  if (isWorkspacePage) {
                    const ok = await runWorkspaceSaveHandler();
                    if (!ok) return;
                    closeWorkspace();
                    return;
                  }

                  // On other pages: back returns to the workspace page.
                  navigate("/");
                }}
                aria-label={backButtonLabel}
                title={backButtonLabel}
              >
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
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{backButtonText}</span>
              </button>
            ) : null}
            <div className="h-10 w-10 shrink-0">
              <img
                src="/favicon.svg"
                alt="Text-pad"
                className="block h-full w-full"
                draggable="false"
                loading="eager"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-slate-900">
                <p className="text-xs font-semibold uppercase leading-none tracking-[0.22em] text-slate-500">
                  TEXT_PAD
                </p>
              </div>
              <div
                className="relative flex items-center gap-2"
                ref={workspaceMenuRef}
              >
                <p className="text-base font-semibold leading-tight text-slate-900 md:text-lg">
                  {workspaceLabel}
                </p>
                {hasWorkspace ? (
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => setIsWorkspaceMenuOpen((prev) => !prev)}
                    aria-label="Workspace settings"
                  >
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
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                ) : null}

                {hasWorkspace && isWorkspaceMenuOpen ? (
                  <div className="absolute left-0 top-full mt-2 w-[320px] rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Workspace Settings
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Rename your workspace ID. This changes how you open it.
                    </p>
                    <div className="mt-3 space-y-2">
                      <input
                        className="input"
                        value={draftWorkspaceId}
                        onChange={(event) => setDraftWorkspaceId(event.target.value)}
                        placeholder="New workspace ID"
                        disabled={isRenaming}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void handleRename();
                          }
                          if (event.key === "Escape") {
                            setIsWorkspaceMenuOpen(false);
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={handleRename}
                          disabled={isRenaming || draftWorkspaceId.trim().length < 3}
                        >
                          Save
                        </button>
                        <NavLink
                          to="/settings"
                          className="btn btn-ghost"
                          onClick={(event) => {
                            event.preventDefault();
                            void goTo("/settings");
                          }}
                        >
                          More
                        </NavLink>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            {baseNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(event) => {
                  event.preventDefault();
                  void goTo(item.to);
                }}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {hasWorkspace ? (
              <NavLink
                to="/settings"
                onClick={(event) => {
                  event.preventDefault();
                  void goTo("/settings");
                }}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                Settings
              </NavLink>
            ) : null}
          </nav>

          <button
            type="button"
            className="btn btn-ghost md:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            Menu
          </button>
        </div>

        {isOpen ? (
          <div className="border-t border-slate-200 bg-transparent px-4 py-2.5 md:hidden">
            <div className="flex flex-col gap-2">
              {baseNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(event) => {
                    event.preventDefault();
                    void goTo(item.to);
                  }}
                  className={({ isActive }) =>
                    `rounded-2xl px-3 py-2 text-sm font-semibold ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {hasWorkspace ? (
                <NavLink
                  to="/settings"
                  onClick={(event) => {
                    event.preventDefault();
                    void goTo("/settings");
                  }}
                  className={({ isActive }) =>
                    `rounded-2xl px-3 py-2 text-sm font-semibold ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  Settings
                </NavLink>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
