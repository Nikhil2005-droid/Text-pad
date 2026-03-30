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

export function WorkspaceProvider({ children }) {
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
  const workspaceSaveHandlerRef = useRef(null);

  const rememberProtectedWorkspace = useCallback((workspaceId) => {
    if (!workspaceId) return;
    writeStorage(PROTECTED_WORKSPACE_ID_KEY, workspaceId);
  }, []);

  const forgetProtectedWorkspace = useCallback(() => {
    writeStorage(PROTECTED_WORKSPACE_ID_KEY, null);
  }, []);

  const clearWorkspaceOpenState = useCallback(() => {
    setWorkspacePasswordInput("");
    setRequiresWorkspacePassword(false);
    setWorkspaceOpenError("");
  }, []);

  const promptForProtectedWorkspace = useCallback((workspaceId) => {
    if (!workspaceId) return;
    setWorkspace(null);
    setWorkspaceAccessToken(null);
    setWorkspaceIdInput(workspaceId);
    setWorkspacePasswordInput("");
    setRequiresWorkspacePassword(true);
    setWorkspaceOpenError(PROTECTED_WORKSPACE_PROMPT);
  }, []);

  const applyWorkspaceResponse = useCallback((payload, fallbackAccessToken = null) => {
    if (!payload || typeof payload !== "object") return null;

    const nextWorkspace = { ...payload };
    const nextAccessToken = Object.prototype.hasOwnProperty.call(
      nextWorkspace,
      "accessToken"
    )
      ? nextWorkspace.accessToken
      : fallbackAccessToken;

    delete nextWorkspace.accessToken;

    if (nextWorkspace.isPasswordProtected && nextWorkspace.workspaceId) {
      rememberProtectedWorkspace(nextWorkspace.workspaceId);
    } else {
      forgetProtectedWorkspace();
    }

    setWorkspace(nextWorkspace);
    setWorkspaceAccessToken(nextAccessToken || null);

    return nextWorkspace;
  }, [forgetProtectedWorkspace, rememberProtectedWorkspace]);

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

      workspaceSaveHandlerRef.current = null;
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
      // If handler returns `false`, treat that as "do not proceed".
      return result !== false;
    } catch {
      return false;
    }
  }, []);

  const openWorkspace = useCallback(
    async (passwordOverride) => {
      const trimmed = workspaceIdInput.trim();
      if (trimmed.length < 3) return null;

      try {
        const data = await openWorkspaceAPI(
          trimmed,
          typeof passwordOverride === "string"
            ? passwordOverride
            : workspacePasswordInput
        );
        clearWorkspaceOpenState();
        return applyWorkspaceResponse(data);
      } catch (error) {
        if (error?.requiresPassword) {
          setRequiresWorkspacePassword(true);
          setWorkspaceOpenError(
            error?.message || "This workspace is protected by a password."
          );
          return null;
        }

        setWorkspaceOpenError(error?.message || "Failed to open workspace");
        window.alert(error?.message || "Failed to open workspace");
        return null;
      }
    },
    [
      applyWorkspaceResponse,
      clearWorkspaceOpenState,
      workspaceIdInput,
      workspacePasswordInput,
    ]
  );

  const lockWorkspace = useCallback(
    (workspaceIdOverride = "") => {
      const protectedWorkspaceId =
        (typeof workspaceIdOverride === "string"
          ? workspaceIdOverride.trim()
          : "") || workspace?.workspaceId || readProtectedWorkspaceId();

      if (!protectedWorkspaceId) return;

      workspaceSaveHandlerRef.current = null;
      rememberProtectedWorkspace(protectedWorkspaceId);
      promptForProtectedWorkspace(protectedWorkspaceId);
    },
    [promptForProtectedWorkspace, rememberProtectedWorkspace, workspace]
  );

  const closeWorkspace = () => {
    workspaceSaveHandlerRef.current = null;
    forgetProtectedWorkspace();
    clearWorkspaceOpenState();
    setWorkspaceAccessToken(null);
    setWorkspace(null);
  };

  const deleteWorkspace = useCallback(async () => {
    if (!workspace) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workspace?"
    );
    if (!confirmDelete) return;

    try {
      await deleteWorkspaceAPI(workspace.workspaceId, workspaceAccessToken);
      workspaceSaveHandlerRef.current = null;
      forgetProtectedWorkspace();
      clearWorkspaceOpenState();
      setWorkspaceAccessToken(null);
      setWorkspace(null);
      setWorkspaceIdInput("");
    } catch (error) {
      window.alert(error?.message || "Failed to delete workspace");
    }
  }, [
    clearWorkspaceOpenState,
    forgetProtectedWorkspace,
    workspace,
    workspaceAccessToken,
  ]);

  const migrateKey = (oldKey, newKey) => {
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
  };

  const renameWorkspace = useCallback(
    async (nextWorkspaceId) => {
      if (!workspace) return null;
      const trimmed = (nextWorkspaceId ?? "").trim();
      if (trimmed.length < 3) return null;

      const oldId = workspace.workspaceId;
      try {
        const data = await updateWorkspaceAPI(
          oldId,
          {
            nextWorkspaceId: trimmed,
            workspaceName: trimmed,
          },
          workspaceAccessToken
        );
        applyWorkspaceResponse(data, workspaceAccessToken);
        setWorkspaceIdInput(trimmed);

        migrateKey(`pinnedNotes:${oldId}`, `pinnedNotes:${trimmed}`);
        migrateKey(`pinnedCodes:${oldId}`, `pinnedCodes:${trimmed}`);

        return data;
      } catch (error) {
        window.alert(error?.message || "Failed to rename workspace");
        return null;
      }
    },
    [applyWorkspaceResponse, workspace, workspaceAccessToken]
  );

  const updatePreferences = useCallback(
    async (patch) => {
      if (!workspace) return null;
      if (!patch || typeof patch !== "object") return null;

      try {
        const data = await updateWorkspaceAPI(
          workspace.workspaceId,
          {
            preferences: patch,
          },
          workspaceAccessToken
        );
        applyWorkspaceResponse(data, workspaceAccessToken);
        return data;
      } catch (error) {
        window.alert(error?.message || "Failed to update preferences");
        return null;
      }
    },
    [applyWorkspaceResponse, workspace, workspaceAccessToken]
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
        const nextWorkspace = applyWorkspaceResponse(data, workspaceAccessToken);
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
    openWorkspace,
    lockWorkspace,
    closeWorkspace,
    deleteWorkspace,
    renameWorkspace,
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
