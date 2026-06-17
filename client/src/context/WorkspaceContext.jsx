import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  deleteWorkspaceAPI,
  openWorkspaceAPI,
  updateWorkspaceAPI,
} from "../api";
import { useAppFeedback } from "./AppFeedbackContext.jsx";
import {
  readRecentWorkspaces,
  removeRecentWorkspace,
  replaceRecentWorkspace,
  upsertRecentWorkspace,
  writeRecentWorkspaces,
} from "../utils/recentWorkspaces.js";

const WorkspaceContext = createContext(null);
const PROTECTED_WORKSPACE_ID_KEY = "textpad.protectedWorkspaceId";
const PROTECTED_WORKSPACE_PROMPT =
  "Enter the workspace protection password to continue.";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null || value === undefined || value === "") {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage errors
  }
}

function readProtectedWorkspaceId() {
  return readStorage(PROTECTED_WORKSPACE_ID_KEY) || "";
}

function migrateKey(oldKey, newKey) {
  try {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue === null) return;
    if (localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, oldValue);
    }
    localStorage.removeItem(oldKey);
  } catch {
    // ignore storage errors
  }
}

export function WorkspaceProvider({ children }) {
  const { confirm, notify } = useAppFeedback();
  const initialProtectedWorkspaceId = readProtectedWorkspaceId();
  const shouldPromptForProtectedWorkspace = Boolean(
    initialProtectedWorkspaceId
  );
  const [workspace, setWorkspace] = useState(null);
  const [workspaceAccessToken, setWorkspaceAccessToken] = useState(null);
  const [workspaceIdInput, setWorkspaceIdInput] = useState(
    shouldPromptForProtectedWorkspace ? initialProtectedWorkspaceId : ""
  );
  const [workspacePasswordInput, setWorkspacePasswordInput] = useState("");
  const [requiresWorkspacePassword, setRequiresWorkspacePassword] =
    useState(shouldPromptForProtectedWorkspace);
  const [workspaceOpenError, setWorkspaceOpenError] = useState(
    shouldPromptForProtectedWorkspace ? PROTECTED_WORKSPACE_PROMPT : ""
  );
  const [recentWorkspaces, setRecentWorkspaces] = useState(() =>
    readRecentWorkspaces()
  );
  const workspaceSaveHandlerRef = useRef(null);
  const workspaceRef = useRef(null);
  const workspaceAccessTokenRef = useRef(null);
  const confirmedWorkspaceRef = useRef(null);
  const confirmedAccessTokenRef = useRef(null);
  const pendingPreferencePatchesRef = useRef([]);
  const preferenceQueueRef = useRef(Promise.resolve());
  const preferenceMutationIdRef = useRef(0);

  const rememberProtectedWorkspace = useCallback((workspaceId) => {
    if (!workspaceId) return;
    writeStorage(PROTECTED_WORKSPACE_ID_KEY, workspaceId);
  }, []);

  const forgetProtectedWorkspace = useCallback(() => {
    writeStorage(PROTECTED_WORKSPACE_ID_KEY, null);
  }, []);

  const updateRecentWorkspaces = useCallback((updater) => {
    setRecentWorkspaces((current) => {
      const next =
        typeof updater === "function" ? updater(current) : current;
      writeRecentWorkspaces(next);
      return next;
    });
  }, []);

  const rememberRecentWorkspace = useCallback(
    (nextWorkspace, { bumpTimestamp = true } = {}) => {
      if (!nextWorkspace?.workspaceId) return;

      updateRecentWorkspaces((current) => {
        const previous = current.find(
          (entry) => entry.workspaceId === nextWorkspace.workspaceId
        );

        return upsertRecentWorkspace(current, {
          workspaceId: nextWorkspace.workspaceId,
          workspaceName:
            nextWorkspace.workspaceName || nextWorkspace.workspaceId,
          isPasswordProtected: nextWorkspace.isPasswordProtected,
          lastOpenedAt:
            bumpTimestamp || !previous?.lastOpenedAt
              ? new Date().toISOString()
              : previous.lastOpenedAt,
        });
      });
    },
    [updateRecentWorkspaces]
  );

  const forgetRecentWorkspace = useCallback(
    (workspaceId) => {
      if (!workspaceId) return;
      updateRecentWorkspaces((current) =>
        removeRecentWorkspace(current, workspaceId)
      );
    },
    [updateRecentWorkspaces]
  );

  const resetWorkspaceSession = useCallback(() => {
    workspaceSaveHandlerRef.current = null;
    workspaceRef.current = null;
    workspaceAccessTokenRef.current = null;
    confirmedWorkspaceRef.current = null;
    confirmedAccessTokenRef.current = null;
    pendingPreferencePatchesRef.current = [];
    preferenceQueueRef.current = Promise.resolve();
    preferenceMutationIdRef.current = 0;
  }, []);

  const clearWorkspaceOpenState = useCallback(() => {
    setWorkspacePasswordInput("");
    setRequiresWorkspacePassword(false);
    setWorkspaceOpenError("");
  }, []);

  const promptForProtectedWorkspace = useCallback(
    (workspaceId) => {
      if (!workspaceId) return;
      resetWorkspaceSession();
      setWorkspace(null);
      setWorkspaceAccessToken(null);
      setWorkspaceIdInput(workspaceId);
      setWorkspacePasswordInput("");
      setRequiresWorkspacePassword(true);
      setWorkspaceOpenError(PROTECTED_WORKSPACE_PROMPT);
    },
    [resetWorkspaceSession]
  );

  const parseWorkspaceResponse = useCallback(
    (payload, fallbackAccessToken = null) => {
      if (!payload || typeof payload !== "object") return null;

      const nextWorkspace = { ...payload };
      const nextAccessToken = Object.prototype.hasOwnProperty.call(
        nextWorkspace,
        "accessToken"
      )
        ? nextWorkspace.accessToken
        : fallbackAccessToken;

      delete nextWorkspace.accessToken;

      return {
        workspace: nextWorkspace,
        accessToken: nextAccessToken || null,
      };
    },
    []
  );

  const setWorkspaceSnapshot = useCallback(
    (nextWorkspace, nextAccessToken, options = {}) => {
      if (!nextWorkspace || typeof nextWorkspace !== "object") return null;

      if (nextWorkspace.isPasswordProtected && nextWorkspace.workspaceId) {
        rememberProtectedWorkspace(nextWorkspace.workspaceId);
      } else {
        forgetProtectedWorkspace();
      }

      workspaceRef.current = nextWorkspace;
      workspaceAccessTokenRef.current = nextAccessToken || null;
      setWorkspace(nextWorkspace);
      setWorkspaceAccessToken(nextAccessToken || null);

      if (options.confirmed) {
        confirmedWorkspaceRef.current = nextWorkspace;
        confirmedAccessTokenRef.current = nextAccessToken || null;
      }

      if (options.rememberRecent) {
        rememberRecentWorkspace(nextWorkspace, {
          bumpTimestamp: options.bumpRecentTimestamp !== false,
        });
      }

      return nextWorkspace;
    },
    [
      forgetProtectedWorkspace,
      rememberProtectedWorkspace,
      rememberRecentWorkspace,
    ]
  );

  const applyWorkspaceResponse = useCallback(
    (payload, fallbackAccessToken = null, options = {}) => {
      const parsed = parseWorkspaceResponse(payload, fallbackAccessToken);
      if (!parsed) return null;

      return setWorkspaceSnapshot(parsed.workspace, parsed.accessToken, {
        confirmed: true,
        rememberRecent: options.rememberRecent,
        bumpRecentTimestamp: options.bumpRecentTimestamp,
      });
    },
    [parseWorkspaceResponse, setWorkspaceSnapshot]
  );

  useEffect(() => {
    workspaceRef.current = workspace;
    workspaceAccessTokenRef.current = workspaceAccessToken;
  }, [workspace, workspaceAccessToken]);

  const handleWorkspaceIdInput = useCallback(
    (value) => {
      setWorkspaceIdInput(value);
      clearWorkspaceOpenState();
    },
    [clearWorkspaceOpenState]
  );

  const handleWorkspacePasswordInput = useCallback((value) => {
    setWorkspacePasswordInput(value);
    setWorkspaceOpenError("");
  }, []);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (!event.persisted) return;

      const protectedWorkspaceId = readProtectedWorkspaceId();
      if (!protectedWorkspaceId) return;

      promptForProtectedWorkspace(protectedWorkspaceId);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [promptForProtectedWorkspace]);

  const setWorkspaceSaveHandler = useCallback((handler) => {
    workspaceSaveHandlerRef.current =
      typeof handler === "function" ? handler : null;
  }, []);

  const runWorkspaceSaveHandler = useCallback(async () => {
    const handler = workspaceSaveHandlerRef.current;
    if (typeof handler !== "function") return true;
    try {
      const result = await handler();
      return result !== false;
    } catch {
      return false;
    }
  }, []);

  const openWorkspaceById = useCallback(
    async (targetWorkspaceId, passwordOverride) => {
      const trimmed = targetWorkspaceId.trim();
      if (trimmed.length < 3) return null;

      setWorkspaceIdInput(trimmed);

      try {
        const data = await openWorkspaceAPI(
          trimmed,
          typeof passwordOverride === "string"
            ? passwordOverride
            : workspacePasswordInput
        );
        clearWorkspaceOpenState();
        return applyWorkspaceResponse(data, null, {
          rememberRecent: true,
        });
      } catch (error) {
        if (error?.requiresPassword) {
          setRequiresWorkspacePassword(true);
          setWorkspaceOpenError(
            error?.message || "This workspace is protected by a password."
          );
          return null;
        }

        setWorkspaceOpenError(error?.message || "Failed to open workspace");
        return null;
      }
    },
    [
      applyWorkspaceResponse,
      clearWorkspaceOpenState,
      workspacePasswordInput,
    ]
  );

  const openWorkspace = useCallback(
    async (passwordOverride) =>
      openWorkspaceById(workspaceIdInput, passwordOverride),
    [openWorkspaceById, workspaceIdInput]
  );

  const openRecentWorkspace = useCallback(
    async (recentWorkspace) => {
      const nextWorkspaceId =
        typeof recentWorkspace === "string"
          ? recentWorkspace
          : recentWorkspace?.workspaceId;
      if (!nextWorkspaceId) return null;

      setWorkspacePasswordInput("");
      return openWorkspaceById(nextWorkspaceId, "");
    },
    [openWorkspaceById]
  );

  const lockWorkspace = useCallback(
    (workspaceIdOverride = "") => {
      const protectedWorkspaceId =
        (typeof workspaceIdOverride === "string"
          ? workspaceIdOverride.trim()
          : "") || workspace?.workspaceId || readProtectedWorkspaceId();

      if (!protectedWorkspaceId) return;

      rememberProtectedWorkspace(protectedWorkspaceId);
      promptForProtectedWorkspace(protectedWorkspaceId);
    },
    [promptForProtectedWorkspace, rememberProtectedWorkspace, workspace]
  );

  const closeWorkspace = () => {
    resetWorkspaceSession();
    forgetProtectedWorkspace();
    clearWorkspaceOpenState();
    setWorkspace(null);
    setWorkspaceAccessToken(null);
  };

  const deleteWorkspace = useCallback(
    async () => {
      if (!workspace) return;

      const confirmed = await confirm({
        title: "Delete this workspace?",
        message:
          "This removes the workspace, all of its notes, and every code entry inside it.",
        confirmLabel: "Delete workspace",
        cancelLabel: "Keep workspace",
        tone: "danger",
      });
      if (!confirmed) return;

      try {
        await deleteWorkspaceAPI(workspace.workspaceId, workspaceAccessToken);
        resetWorkspaceSession();
        forgetProtectedWorkspace();
        forgetRecentWorkspace(workspace.workspaceId);
        clearWorkspaceOpenState();
        setWorkspace(null);
        setWorkspaceAccessToken(null);
        setWorkspaceIdInput("");
        notify({
          title: "Workspace deleted",
          message: "The workspace and its saved items have been removed.",
          tone: "success",
        });
      } catch (error) {
        notify({
          title: "Delete failed",
          message: error?.message || "Failed to delete workspace",
          tone: "error",
        });
      }
    },
    [
      clearWorkspaceOpenState,
      confirm,
      forgetProtectedWorkspace,
      forgetRecentWorkspace,
      notify,
      resetWorkspaceSession,
      workspace,
      workspaceAccessToken,
    ]
  );

  const updateWorkspaceIdentity = useCallback(
    async ({ workspaceName, nextWorkspaceId } = {}) => {
      if (!workspace) return null;

      const oldId = workspace.workspaceId;
      const nextIdProvided = typeof nextWorkspaceId === "string";
      const nextNameProvided = typeof workspaceName === "string";
      const trimmedNextId = nextIdProvided ? nextWorkspaceId.trim() : "";
      const trimmedNextName = nextNameProvided ? workspaceName.trim() : "";
      const patch = {};

      if (nextIdProvided) {
        if (trimmedNextId.length < 3) return null;
        patch.nextWorkspaceId = trimmedNextId;
      }

      if (nextNameProvided) {
        patch.workspaceName = trimmedNextName || trimmedNextId || oldId;
      } else if (nextIdProvided) {
        const currentName = workspace.workspaceName?.trim() || "";
        if (!currentName || currentName === oldId) {
          patch.workspaceName = trimmedNextId;
        }
      }

      if (Object.keys(patch).length === 0) {
        return workspace;
      }

      try {
        const data = await updateWorkspaceAPI(oldId, patch, workspaceAccessToken);
        applyWorkspaceResponse(data, workspaceAccessToken, {
          rememberRecent: true,
          bumpRecentTimestamp: false,
        });

        if (patch.nextWorkspaceId) {
          setWorkspaceIdInput(patch.nextWorkspaceId);
          migrateKey(`pinnedNotes:${oldId}`, `pinnedNotes:${patch.nextWorkspaceId}`);
          migrateKey(`pinnedCodes:${oldId}`, `pinnedCodes:${patch.nextWorkspaceId}`);
          updateRecentWorkspaces((current) =>
            replaceRecentWorkspace(current, oldId, {
              workspaceId: patch.nextWorkspaceId,
              workspaceName:
                patch.workspaceName ||
                workspace.workspaceName ||
                patch.nextWorkspaceId,
              isPasswordProtected: workspace.isPasswordProtected,
              lastOpenedAt:
                current.find((entry) => entry.workspaceId === oldId)?.lastOpenedAt ??
                new Date().toISOString(),
            })
          );
        } else {
          rememberRecentWorkspace(
            {
              ...(workspaceRef.current ?? workspace),
              workspaceName:
                patch.workspaceName ||
                workspace.workspaceName ||
                workspace.workspaceId,
            },
            { bumpTimestamp: false }
          );
        }

        return data;
      } catch (error) {
        notify({
          title: "Workspace update failed",
          message: error?.message || "Unable to update the workspace right now.",
          tone: "error",
        });
        return null;
      }
    },
    [
      applyWorkspaceResponse,
      notify,
      rememberRecentWorkspace,
      updateRecentWorkspaces,
      workspace,
      workspaceAccessToken,
    ]
  );

  const updateWorkspaceTitle = useCallback(
    async (nextWorkspaceName) =>
      updateWorkspaceIdentity({ workspaceName: nextWorkspaceName }),
    [updateWorkspaceIdentity]
  );

  const renameWorkspaceId = useCallback(
    async (nextWorkspaceId) =>
      updateWorkspaceIdentity({ nextWorkspaceId }),
    [updateWorkspaceIdentity]
  );

  const updatePreferences = useCallback(
    async (patch) => {
      const currentWorkspace = workspaceRef.current;
      const currentAccessToken = workspaceAccessTokenRef.current;
      if (!currentWorkspace) return null;
      if (!patch || typeof patch !== "object") return null;
      if (Object.keys(patch).length === 0) return null;

      const mutationId = ++preferenceMutationIdRef.current;
      pendingPreferencePatchesRef.current = [
        ...pendingPreferencePatchesRef.current,
        { id: mutationId, patch },
      ];

      const mergePendingPatches = () =>
        pendingPreferencePatchesRef.current.reduce(
          (merged, entry) => ({ ...merged, ...entry.patch }),
          {}
        );

      setWorkspaceSnapshot(
        {
          ...currentWorkspace,
          preferences: {
            ...(currentWorkspace.preferences ?? {}),
            ...mergePendingPatches(),
          },
        },
        currentAccessToken
      );

      const runMutation = async () => {
        try {
          const data = await updateWorkspaceAPI(
            currentWorkspace.workspaceId,
            {
              preferences: patch,
            },
            currentAccessToken
          );

          const parsed = parseWorkspaceResponse(data, currentAccessToken);
          pendingPreferencePatchesRef.current = pendingPreferencePatchesRef.current.filter(
            (entry) => entry.id !== mutationId
          );

          if (!parsed) {
            return data;
          }

          const activeWorkspaceId =
            workspaceRef.current?.workspaceId ??
            confirmedWorkspaceRef.current?.workspaceId;
          if (activeWorkspaceId !== currentWorkspace.workspaceId) {
            return data;
          }

          confirmedWorkspaceRef.current = parsed.workspace;
          confirmedAccessTokenRef.current = parsed.accessToken;

          setWorkspaceSnapshot(
            {
              ...parsed.workspace,
              preferences: {
                ...(parsed.workspace.preferences ?? {}),
                ...mergePendingPatches(),
              },
            },
            parsed.accessToken
          );

          return data;
        } catch (error) {
          pendingPreferencePatchesRef.current = pendingPreferencePatchesRef.current.filter(
            (entry) => entry.id !== mutationId
          );

          const activeWorkspaceId =
            workspaceRef.current?.workspaceId ??
            confirmedWorkspaceRef.current?.workspaceId;
          if (activeWorkspaceId !== currentWorkspace.workspaceId) {
            return null;
          }

          const rollbackWorkspace =
            confirmedWorkspaceRef.current ?? currentWorkspace;
          const rollbackAccessToken =
            confirmedAccessTokenRef.current ?? currentAccessToken;

          if (rollbackWorkspace) {
            setWorkspaceSnapshot(
              {
                ...rollbackWorkspace,
                preferences: {
                  ...(rollbackWorkspace.preferences ?? {}),
                  ...mergePendingPatches(),
                },
              },
              rollbackAccessToken
            );
          }

          notify({
            title: "Preferences were not saved",
            message: error?.message || "Failed to update preferences",
            tone: "error",
          });
          return null;
        }
      };

      preferenceQueueRef.current = preferenceQueueRef.current.then(
        runMutation,
        runMutation
      );

      return preferenceQueueRef.current;
    },
    [notify, parseWorkspaceResponse, setWorkspaceSnapshot]
  );

  const updateWorkspaceSecurity = useCallback(
    async (patch) => {
      if (!workspace) {
        return {
          data: null,
          error: new Error("Open a workspace first"),
        };
      }
      if (!patch || typeof patch !== "object") {
        return {
          data: null,
          error: new Error("Invalid workspace security settings"),
        };
      }

      try {
        const data = await updateWorkspaceAPI(
          workspace.workspaceId,
          { security: patch },
          workspaceAccessToken
        );
        const nextWorkspace = applyWorkspaceResponse(data, workspaceAccessToken, {
          rememberRecent: true,
          bumpRecentTimestamp: false,
        });
        return { data: nextWorkspace, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    [applyWorkspaceResponse, workspace, workspaceAccessToken]
  );

  const value = {
    workspace,
    workspaceAccessToken,
    workspaceIdInput,
    setWorkspaceIdInput: handleWorkspaceIdInput,
    workspacePasswordInput,
    setWorkspacePasswordInput: handleWorkspacePasswordInput,
    requiresWorkspacePassword,
    workspaceOpenError,
    recentWorkspaces,
    openWorkspace,
    openRecentWorkspace,
    removeRecentWorkspace: forgetRecentWorkspace,
    lockWorkspace,
    closeWorkspace,
    deleteWorkspace,
    renameWorkspaceId,
    renameWorkspace: renameWorkspaceId,
    updateWorkspaceTitle,
    updateWorkspaceIdentity,
    updatePreferences,
    updateWorkspaceSecurity,
    setWorkspaceSaveHandler,
    runWorkspaceSaveHandler,
    setWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  }
  return ctx;
}
