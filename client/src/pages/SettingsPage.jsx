import { useEffect, useState } from "react";
import { useWorkspace } from "../hooks/useWorkspace";

export default function SettingsPage() {
  const {
    workspace,
    renameWorkspace,
    updatePreferences,
    updateWorkspaceSecurity,
  } = useWorkspace();
  const [draftName, setDraftName] = useState("");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityTone, setSecurityTone] = useState("info");
  const [securityAction, setSecurityAction] = useState("set");

  useEffect(() => {
    setDraftName(workspace?.workspaceId ?? "");
  }, [workspace?.workspaceId]);

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
  const shouldShowPasswordForm =
    !isPasswordProtected || isChangingPassword || isRemovingPassword;

  const securityMessageClass =
    securityTone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : securityTone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  const setPref = async (key, value) => {
    if (!workspace) return;
    setIsSavingPrefs(true);
    await updatePreferences({ [key]: value });
    setIsSavingPrefs(false);
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
    <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
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
                  Replaces sequences like -&gt;, &lt;=, and != with cleaner symbols while typing.
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
                  Shows "Saved note/code" when switching items or leaving the workspace.
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

      <div className="space-y-6">
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Modify Workspace
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Rename the current workspace ID. This changes how you open it.
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

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Security
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                Workspace Protection
              </h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPasswordProtected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isPasswordProtected ? "Protected" : "Unlocked"}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Add a password here if you want this whole workspace to require one
            before it opens.
          </p>

          <div className="mt-5 space-y-3">
            {isPasswordProtected ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Workspace password has been set. This workspace now asks for a
                password before it opens.
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

                <p className="text-xs text-slate-500">
                  {isRemovingPassword
                    ? "Enter the current password to remove workspace protection."
                    : "Use at least 4 characters. After protection is enabled, opening this workspace will require the password."}
                </p>
              </>
            ) : null}

            {securityMessage ? (
              <div
                className={`rounded-2xl border px-3 py-2 text-sm ${securityMessageClass}`}
              >
                {securityMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </div>
  );
}
