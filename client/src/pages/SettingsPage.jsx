import { useEffect, useState } from "react";
import { useWorkspace } from "../hooks/useWorkspace";

function ToggleCard({
  title,
  description,
  checked,
  disabled,
  onToggle,
}) {
  return (
    <div className="panel-muted p-4 md:p-5 flex flex-col justify-between h-full min-h-[110px] transition duration-200 hover:shadow-[0_12px_24px_rgba(76,58,38,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
            checked
              ? "border-[rgba(149,81,35,0.22)] bg-[linear-gradient(135deg,#c6753b_0%,#985225_100%)]"
              : "border-[rgba(104,84,58,0.14)] bg-white/70"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    workspace,
    renameWorkspaceId,
    updateWorkspaceTitle,
    updatePreferences,
    updateWorkspaceSecurity,
  } = useWorkspace();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftWorkspaceId, setDraftWorkspaceId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingIdentityField, setSavingIdentityField] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityTone, setSecurityTone] = useState("info");
  const [securityAction, setSecurityAction] = useState("set");

  useEffect(() => {
    setDraftTitle(workspace?.workspaceName ?? workspace?.workspaceId ?? "");
    setDraftWorkspaceId(workspace?.workspaceId ?? "");
  }, [workspace?.workspaceId, workspace?.workspaceName]);

  useEffect(() => {
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setSecurityMessage("");
    setSecurityTone("info");
    setSecurityAction(workspace?.isPasswordProtected ? "idle" : "set");
  }, [workspace?.isPasswordProtected, workspace?.workspaceId]);

  const prefs = workspace?.preferences ?? {};
  const autoReplaceEnabled = prefs.autoReplace ?? true;
  const ruledNotesEnabled = prefs.ruledNotes ?? true;
  const confirmDeletes = prefs.confirmDeletes ?? true;
  const showAutosaveToasts = prefs.showAutosaveToasts ?? false;
  const isPasswordProtected = workspace?.isPasswordProtected ?? false;
  const isChangingPassword = securityAction === "change";
  const isRemovingPassword = securityAction === "remove";
  const workspaceTitle = workspace?.workspaceName?.trim() || workspace?.workspaceId || "";
  const normalizedDraftTitle =
    draftTitle.trim() || draftWorkspaceId.trim() || workspace?.workspaceId || "";
  const titleChanged = normalizedDraftTitle !== workspaceTitle;
  const workspaceIdChanged =
    draftWorkspaceId.trim() !== (workspace?.workspaceId ?? "");
  const shouldShowPasswordForm =
    !isPasswordProtected || isChangingPassword || isRemovingPassword;

  const securityMessageClass =
    securityTone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : securityTone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-[rgba(104,84,58,0.12)] bg-white/55 text-slate-600";

  const setPref = async (key, value) => {
    if (!workspace) return;
    await updatePreferences({ [key]: value });
  };

  const handleSaveTitle = async () => {
    if (!workspace) return;
    setSavingIdentityField("title");
    const data = await updateWorkspaceTitle(draftTitle);
    setSavingIdentityField("");

    if (data) {
      setDraftTitle(data.workspaceName ?? data.workspaceId ?? "");
    }
  };

  const handleSaveWorkspaceId = async () => {
    if (!workspace) return;
    const nextId = draftWorkspaceId.trim();
    if (nextId.length < 3) return;

    setSavingIdentityField("id");
    const data = await renameWorkspaceId(nextId);
    setSavingIdentityField("");

    if (data) {
      setDraftWorkspaceId(data.workspaceId ?? nextId);
      setDraftTitle(data.workspaceName ?? data.workspaceId ?? nextId);
    }
  };

  const handleEnableOrChangeProtection = async () => {
    if (!workspace) return;

    if (nextPassword.length < 4) {
      setSecurityTone("error");
      setSecurityMessage("Workspace password must be at least 4 characters.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setSecurityTone("error");
      setSecurityMessage("New password and confirm password must match.");
      return;
    }

    if (isPasswordProtected && currentPassword.length === 0) {
      setSecurityTone("error");
      setSecurityMessage("Enter your current workspace password first.");
      return;
    }

    setIsSavingSecurity(true);
    const { error } = await updateWorkspaceSecurity(
      isPasswordProtected
        ? { currentPassword, nextPassword }
        : { nextPassword }
    );
    setIsSavingSecurity(false);

    if (error) {
      setSecurityTone("error");
      setSecurityMessage(error.message || "Failed to update workspace password.");
      return;
    }

    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setSecurityTone("success");
    setSecurityMessage(
      isPasswordProtected
        ? "Workspace password has been updated."
        : "Workspace password has been set."
    );
    setSecurityAction("idle");
  };

  const handleRemoveProtection = async () => {
    if (!workspace || !isPasswordProtected) return;

    if (currentPassword.length === 0) {
      setSecurityTone("error");
      setSecurityMessage("Enter your current workspace password to remove protection.");
      return;
    }

    setIsSavingSecurity(true);
    const { error } = await updateWorkspaceSecurity({
      currentPassword,
      removePassword: true,
    });
    setIsSavingSecurity(false);

    if (error) {
      setSecurityTone("error");
      setSecurityMessage(error.message || "Failed to remove workspace protection.");
      return;
    }

    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setSecurityTone("success");
    setSecurityMessage("Workspace protection removed.");
    setSecurityAction("set");
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section className="panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="section-kicker">Settings</p>
            <h1 className="font-display mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
              Shape how this workspace feels
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Preferences are saved inside the current workspace, so the next
              time you reopen it the editor behaves the same way.
            </p>
          </div>

          <span className="ui-chip">
            {workspace ? "Workspace loaded" : "Open a workspace first"}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ToggleCard
            title="Auto-replace symbols"
            description="Replace sequences like ->, <=, and != with cleaner symbols while typing."
            checked={autoReplaceEnabled}
            disabled={!workspace}
            onToggle={() => setPref("autoReplace", !autoReplaceEnabled)}
          />

          <ToggleCard
            title="Ruled lines in notes"
            description="Show notebook-style guide lines behind the note editor."
            checked={ruledNotesEnabled}
            disabled={!workspace}
            onToggle={() => setPref("ruledNotes", !ruledNotesEnabled)}
          />

          <ToggleCard
            title="Confirm before delete"
            description="Ask before deleting notes or code entries from the sidebar."
            checked={confirmDeletes}
            disabled={!workspace}
            onToggle={() => setPref("confirmDeletes", !confirmDeletes)}
          />

          <ToggleCard
            title="Show autosave toasts"
            description="Display save confirmations when switching items or leaving the workspace."
            checked={showAutosaveToasts}
            disabled={!workspace}
            onToggle={() => setPref("showAutosaveToasts", !showAutosaveToasts)}
          />

          {!workspace ? (
            <p className="text-sm text-slate-500">
              Open a workspace first to edit its preferences.
            </p>
          ) : null}
        </div>

      </section>

      <div className="space-y-6">
        <section className="panel-muted p-6">
          <p className="section-kicker">Workspace Identity</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-slate-900">
            Title and reopen ID
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Keep the visible title polished inside the app, and keep the
            workspace ID stable for opening it again later.
          </p>

          <div className="mt-5 space-y-3">
            <div className="panel-inset p-5 md:p-5.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Workspace title
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Shows in the navbar, sidebar, and editor shell.
                  </p>
                </div>
                <span className="ui-chip">Visible in app</span>
              </div>
              <input
                className="input mt-4"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Workspace title"
                disabled={!workspace || savingIdentityField === "title"}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">
                  Leave it blank to fall back to the workspace ID.
                </p>
                <button
                  className="btn btn-primary"
                  disabled={
                    !workspace ||
                    savingIdentityField === "title" ||
                    !titleChanged
                  }
                  onClick={handleSaveTitle}
                >
                  Save Title
                </button>
              </div>
            </div>

            <div className="panel-inset p-5 md:p-5.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Workspace ID
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Type this on the entry screen when you want to reopen this workspace.
                  </p>
                </div>
                <span className="ui-chip">Used at entry</span>
              </div>
              <input
                className="input mt-4"
                value={draftWorkspaceId}
                onChange={(event) => setDraftWorkspaceId(event.target.value)}
                placeholder="workspace-id"
                disabled={!workspace || savingIdentityField === "id"}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">
                  Use at least 3 characters. Changing this affects how you reopen the workspace.
                </p>
                <button
                  className="btn btn-primary"
                  disabled={
                    !workspace ||
                    savingIdentityField === "id" ||
                    draftWorkspaceId.trim().length < 3 ||
                    !workspaceIdChanged
                  }
                  onClick={handleSaveWorkspaceId}
                >
                  Save ID
                </button>
              </div>
            </div>

            {!workspace ? (
              <p className="text-sm text-slate-500">
                Open a workspace first to edit its title or ID.
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel p-6 md:p-7.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Security</p>
              <h2 className="font-display mt-2 text-3xl font-semibold text-slate-900">
                Workspace Protection
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPasswordProtected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white/55 text-slate-600"
              }`}
            >
              {isPasswordProtected ? "Protected" : "Unlocked"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Add a password if this workspace needs a private entry point before
            its content loads.
          </p>

          <div className="mt-5 space-y-3">
            {isPasswordProtected ? (
              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Workspace password has been set. Opening this workspace now
                requires a password.
              </div>
            ) : null}

            {shouldShowPasswordForm ? (
              <>
                {isPasswordProtected ? (
                  <input
                    className="input"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setSecurityMessage("");
                    }}
                    placeholder="Current workspace password"
                    disabled={!workspace || isSavingSecurity}
                    autoComplete="current-password"
                  />
                ) : null}

                {!isRemovingPassword ? (
                  <>
                    <input
                      className="input"
                      type="password"
                      value={nextPassword}
                      onChange={(event) => {
                        setNextPassword(event.target.value);
                        setSecurityMessage("");
                      }}
                      placeholder={
                        isPasswordProtected
                          ? "New workspace password"
                          : "Set workspace password"
                      }
                      disabled={!workspace || isSavingSecurity}
                      autoComplete="new-password"
                    />

                    <input
                      className="input"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setSecurityMessage("");
                      }}
                      placeholder="Confirm workspace password"
                      disabled={!workspace || isSavingSecurity}
                      autoComplete="new-password"
                    />
                  </>
                ) : null}

                <p className="text-xs leading-5 text-slate-500">
                  {isRemovingPassword
                    ? "Enter the current password to remove protection."
                    : "Use at least 4 characters. After protection is enabled, opening this workspace will require the password."}
                </p>
              </>
            ) : null}

            {securityMessage ? (
              <div
                className={`rounded-[1.35rem] border px-4 py-3 text-sm ${securityMessageClass}`}
              >
                {securityMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {isPasswordProtected ? (
                <>
                  {securityAction === "idle" ? (
                    <>
                      <button
                        className="btn btn-primary"
                        disabled={!workspace || isSavingSecurity}
                        onClick={() => {
                          setSecurityAction("change");
                          setSecurityMessage("");
                        }}
                      >
                        Change Password
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={!workspace || isSavingSecurity}
                        onClick={() => {
                          setSecurityAction("remove");
                          setSecurityMessage("");
                        }}
                      >
                        Remove Protection
                      </button>
                    </>
                  ) : (
                    <>
                      {isRemovingPassword ? (
                        <button
                          className="btn btn-danger"
                          disabled={!workspace || isSavingSecurity}
                          onClick={handleRemoveProtection}
                        >
                          Confirm Remove
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          disabled={!workspace || isSavingSecurity}
                          onClick={handleEnableOrChangeProtection}
                        >
                          Save New Password
                        </button>
                      )}
                      <button
                        className="btn btn-ghost"
                        disabled={!workspace || isSavingSecurity}
                        onClick={() => {
                          setSecurityAction("idle");
                          setCurrentPassword("");
                          setNextPassword("");
                          setConfirmPassword("");
                          setSecurityMessage("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={!workspace || isSavingSecurity}
                  onClick={handleEnableOrChangeProtection}
                >
                  Set Workspace Password
                </button>
              )}
            </div>

            {!workspace ? (
              <p className="text-sm text-slate-500">
                Open a workspace first to manage its protection.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
