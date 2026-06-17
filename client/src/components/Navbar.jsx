import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useWorkspace } from "../hooks/useWorkspace";

const baseNavItems = [
  { to: "/", label: "Workspace" },
  { to: "/docs", label: "Docs" },
];

function NavPill({
  item,
  goTo,
  compact = false,
  refCallback,
  isActive = false,
  onPreview,
  onPreviewEnd,
}) {
  return (
    <NavLink
      ref={refCallback}
      to={item.to}
      onPointerEnter={() => onPreview?.(item.to)}
      onFocus={() => onPreview?.(item.to)}
      onPointerLeave={() => onPreviewEnd?.()}
      onBlur={() => onPreviewEnd?.()}
      onClick={(event) => {
        event.preventDefault();
        onPreviewEnd?.();
        void goTo(item.to);
      }}
      className={() =>
        [
          "relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
          compact ? "w-full text-left" : "",
          isActive
            ? "text-white"
            : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [draftWorkspaceName, setDraftWorkspaceName] = useState("");
  const [draftWorkspaceId, setDraftWorkspaceId] = useState("");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceMenuRef = useRef(null);
  const previousPathnameRef = useRef(location.pathname);

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("textpad.darkMode") === "true");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("textpad.darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("textpad.darkMode", "false");
    }
  }, [isDarkMode]);

  const {
    workspace,
    updateWorkspaceIdentity,
    lockWorkspace,
    closeWorkspace,
    runWorkspaceSaveHandler,
  } = useWorkspace();

  const workspaceTitle =
    workspace?.workspaceName?.trim() || workspace?.workspaceId || "No workspace";
  const workspaceIdLabel = workspace?.workspaceId || "";
  const hasWorkspace = !!workspace?.workspaceId;
  const isWorkspacePage =
    location.pathname === "/" || location.pathname === "/workspace";
  const showWorkspaceBackButton = hasWorkspace;
  const backButtonText = isWorkspacePage ? "Workspaces" : "Back";
  const backButtonLabel = isWorkspacePage
    ? "Back to workspace gate"
    : "Back to workspace";
  const navItems = useMemo(
    () =>
      hasWorkspace
        ? [...baseNavItems, { to: "/settings", label: "Settings" }]
        : baseNavItems,
    [hasWorkspace]
  );

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [mobileIndicatorStyle, setMobileIndicatorStyle] = useState({
    top: 0,
    height: 0,
  });
  const [previewPath, setPreviewPath] = useState("");
  const [mobilePreviewPath, setMobilePreviewPath] = useState("");
  const navRef = useRef(null);
  const navItemRefs = useRef({});
  const mobileNavRef = useRef(null);
  const mobileNavItemRefs = useRef({});

  const activePath = useMemo(
    () =>
      navItems.find((item) => {
      if (item.to === "/") {
        return location.pathname === "/" || location.pathname.startsWith("/workspace");
      }
      return location.pathname === item.to || location.pathname.startsWith(item.to);
    })?.to ?? "/",
    [location.pathname, navItems]
  );
  const visibleIndicatorPath = previewPath || activePath;
  const visibleMobileIndicatorPath = mobilePreviewPath || activePath;

  useEffect(() => {
    const activeEl = navItemRefs.current[visibleIndicatorPath];
    const container = navRef.current;
    if (activeEl && container) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    } else {
      setIndicatorStyle({ left: 0, width: 0 });
    }
  }, [visibleIndicatorPath]);

  useEffect(() => {
    if (!isOpen) return;

    const activeEl = mobileNavItemRefs.current[visibleMobileIndicatorPath];
    const container = mobileNavRef.current;
    if (activeEl && container) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setMobileIndicatorStyle({
        top: activeRect.top - containerRect.top,
        height: activeRect.height,
      });
    } else {
      setMobileIndicatorStyle({ top: 0, height: 0 });
    }
  }, [isOpen, visibleMobileIndicatorPath]);

  useEffect(() => {
    if (isWorkspaceMenuOpen) return;
    setDraftWorkspaceName(workspace?.workspaceName ?? workspace?.workspaceId ?? "");
    setDraftWorkspaceId(workspace?.workspaceId ?? "");
  }, [isWorkspaceMenuOpen, workspace?.workspaceId, workspace?.workspaceName]);

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

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const wasWorkspacePage =
      previousPathname === "/" || previousPathname === "/workspace";

    if (isWorkspacePage && !wasWorkspacePage && workspace?.isPasswordProtected) {
      lockWorkspace(workspace.workspaceId);
    }

    previousPathnameRef.current = location.pathname;
  }, [
    isWorkspacePage,
    location.pathname,
    lockWorkspace,
    workspace?.isPasswordProtected,
    workspace?.workspaceId,
  ]);

  const handleSaveIdentity = async () => {
    if (!hasWorkspace) return;
    const nextName = draftWorkspaceName.trim();
    const nextId = draftWorkspaceId.trim();
    if (nextId.length < 3) return;

    const currentTitle =
      workspace?.workspaceName?.trim() || workspace?.workspaceId || "";
    const patch = {};

    if (nextName !== currentTitle) {
      patch.workspaceName = nextName;
    }

    if (nextId !== workspace?.workspaceId) {
      patch.nextWorkspaceId = nextId;
    }

    if (Object.keys(patch).length === 0) {
      setIsWorkspaceMenuOpen(false);
      return;
    }

    setIsSavingIdentity(true);
    const data = await updateWorkspaceIdentity(patch);
    setIsSavingIdentity(false);

    if (data) {
      setDraftWorkspaceName(
        data.workspaceName?.trim() || data.workspaceId || nextId
      );
      setDraftWorkspaceId(data.workspaceId || nextId);
      setIsWorkspaceMenuOpen(false);
    }
  };

  const goTo = async (to) => {
    setIsOpen(false);
    setIsWorkspaceMenuOpen(false);

    const isLeavingWorkspaceRoute =
      isWorkspacePage && !(to === "/" || to === "/workspace");
    if (hasWorkspace && isLeavingWorkspaceRoute) {
      const ok = await runWorkspaceSaveHandler();
      if (!ok) return;
    }

    const isOpeningWorkspaceRoute = to === "/" || to === "/workspace";
    if (
      hasWorkspace &&
      !isWorkspacePage &&
      isOpeningWorkspaceRoute &&
      workspace?.isPasswordProtected
    ) {
      lockWorkspace(workspace.workspaceId);
    }

    navigate(to);
  };

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 md:px-6 xl:px-8">
      <div className="panel mx-auto w-full max-w-[1480px] overflow-visible px-4 py-3 md:px-5 md:py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {showWorkspaceBackButton ? (
              <button
                type="button"
                className="btn btn-ghost px-3"
                onClick={async () => {
                  setIsOpen(false);
                  setIsWorkspaceMenuOpen(false);

                  if (isWorkspacePage) {
                    const ok = await runWorkspaceSaveHandler();
                    if (!ok) return;
                    if (workspace?.isPasswordProtected) {
                      lockWorkspace(workspace.workspaceId);
                      return;
                    }
                    closeWorkspace();
                    return;
                  }

                  await goTo("/");
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

            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[rgba(104,84,58,0.18)] bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(76,58,38,0.06)]">
              <img
                src="/favicon.svg"
                alt="Text-pad"
                className="block h-9 w-9"
                draggable="false"
                loading="eager"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="section-kicker">Text Pad</p>
                <span className="ui-chip hidden sm:inline-flex">
                  {hasWorkspace ? "Workspace live" : "Ready to open"}
                </span>
              </div>

              <div
                className="relative mt-1 flex min-w-0 items-center gap-2"
                ref={workspaceMenuRef}
              >
                <div className="min-w-0 max-w-[min(52vw,26rem)]">
                  <p
                    className="truncate text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-900 md:text-[1.3rem]"
                    title={workspaceTitle}
                  >
                    {workspaceTitle}
                  </p>
                  <p className="hidden text-xs text-slate-500 md:block">
                    {hasWorkspace
                      ? `Workspace ID ${workspaceIdLabel}`
                      : "Open a workspace to enter the editor."}
                  </p>
                </div>

                {hasWorkspace ? (
                  <button
                    type="button"
                    className="icon-button shrink-0"
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
                  <div className="panel absolute left-0 top-full mt-3 w-[min(92vw,360px)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="section-kicker">Workspace Studio</p>
                        <h3 className="font-display mt-2 text-xl font-semibold text-slate-900">
                          Tune title and reopen ID
                        </h3>
                      </div>
                      <span className="ui-chip">Active</span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Adjust the title people see inside the app, or change the
                      workspace ID you use to reopen it later.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Workspace Title
                        </p>
                        <input
                          className="input"
                          value={draftWorkspaceName}
                          onChange={(event) =>
                            setDraftWorkspaceName(event.target.value)
                          }
                          placeholder="Workspace title"
                          disabled={isSavingIdentity}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              void handleSaveIdentity();
                            }
                            if (event.key === "Escape") {
                              setIsWorkspaceMenuOpen(false);
                            }
                          }}
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Workspace ID
                        </p>
                        <input
                          className="input"
                          value={draftWorkspaceId}
                          onChange={(event) =>
                            setDraftWorkspaceId(event.target.value)
                          }
                          placeholder="New workspace ID"
                          disabled={isSavingIdentity}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              void handleSaveIdentity();
                            }
                            if (event.key === "Escape") {
                              setIsWorkspaceMenuOpen(false);
                            }
                          }}
                        />
                      </div>

                      <p className="text-xs leading-5 text-slate-500">
                        Keep the title reader-friendly. Use the workspace ID as
                        the stable key you type when you return.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={handleSaveIdentity}
                          disabled={
                            isSavingIdentity || draftWorkspaceId.trim().length < 3
                          }
                        >
                          Save Changes
                        </button>
                        <NavLink
                          to="/settings"
                          className="btn btn-soft"
                          onClick={(event) => {
                            event.preventDefault();
                            void goTo("/settings");
                          }}
                        >
                          Open Settings
                        </NavLink>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="icon-button h-10 w-10 shrink-0"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
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
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <nav
              ref={navRef}
              className="relative hidden items-center gap-1 rounded-full overflow-hidden border border-[rgba(104,84,58,0.14)] bg-white/40 dark:bg-slate-900/40 p-1 md:flex"
            >
              <span
                className="absolute top-1 bottom-1 rounded-full bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)] shadow-[0_14px_28px_rgba(149,81,35,0.22)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  opacity: indicatorStyle.width > 0 ? 1 : 0,
                }}
              />
              {navItems.map((item) => (
                <NavPill
                  key={item.to}
                  item={item}
                  goTo={goTo}
                  isActive={visibleIndicatorPath === item.to}
                  onPreview={setPreviewPath}
                  onPreviewEnd={() => setPreviewPath("")}
                  refCallback={(el) => {
                    if (el) {
                      navItemRefs.current[item.to] = el;
                    }
                  }}
                />
              ))}
            </nav>

            <button
              type="button"
              className="btn btn-ghost md:hidden"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="mt-4 border-t border-[rgba(104,84,58,0.14)] pt-4 md:hidden">
            <div className="panel-inset p-2">
              <div
                ref={mobileNavRef}
                className="relative flex flex-col gap-1 overflow-hidden rounded-[1.25rem]"
              >
                <span
                  className="absolute left-0 right-0 rounded-full bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)] shadow-[0_14px_28px_rgba(149,81,35,0.22)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    top: `${mobileIndicatorStyle.top}px`,
                    height: `${mobileIndicatorStyle.height}px`,
                    opacity: mobileIndicatorStyle.height > 0 ? 1 : 0,
                  }}
                  aria-hidden="true"
                />
                {navItems.map((item) => (
                  <NavPill
                    key={item.to}
                    item={item}
                    goTo={goTo}
                    compact
                    isActive={visibleMobileIndicatorPath === item.to}
                    onPreview={setMobilePreviewPath}
                    onPreviewEnd={() => setMobilePreviewPath("")}
                    refCallback={(el) => {
                      if (el) {
                        mobileNavItemRefs.current[item.to] = el;
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
