import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  deleteWorkspaceAPI,
  openWorkspaceAPI,
  updateWorkspaceAPI,
} from "../api";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(null);
  const [workspaceIdInput, setWorkspaceIdInput] = useState("");
  const workspaceSaveHandlerRef = useRef(null);

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

  const openWorkspace = async () => {
    const trimmed = workspaceIdInput.trim();
    if (trimmed.length < 3) return null;

    try {
      const data = await openWorkspaceAPI(trimmed);
      setWorkspace(data);
      return data;
    } catch (error) {
      window.alert(error?.message || "Failed to open workspace");
      return null;
    }
  };

  const closeWorkspace = () => {
    workspaceSaveHandlerRef.current = null;
    setWorkspace(null);
  };

  const deleteWorkspace = async () => {
    if (!workspace) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workspace?"
    );
    if (!confirmDelete) return;

    await deleteWorkspaceAPI(workspace.workspaceId);
    workspaceSaveHandlerRef.current = null;
    setWorkspace(null);
    setWorkspaceIdInput("");
  };

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

  const renameWorkspace = async (nextWorkspaceId) => {
    if (!workspace) return null;
    const trimmed = (nextWorkspaceId ?? "").trim();
    if (trimmed.length < 3) return null;

    const oldId = workspace.workspaceId;
    try {
      const data = await updateWorkspaceAPI(oldId, {
        nextWorkspaceId: trimmed,
        workspaceName: trimmed,
      });
      setWorkspace(data);
      setWorkspaceIdInput(trimmed);

      migrateKey(`pinnedNotes:${oldId}`, `pinnedNotes:${trimmed}`);
      migrateKey(`pinnedCodes:${oldId}`, `pinnedCodes:${trimmed}`);

      return data;
    } catch (error) {
      window.alert(error?.message || "Failed to rename workspace");
      return null;
    }
  };

  const updatePreferences = async (patch) => {
    if (!workspace) return null;
    if (!patch || typeof patch !== "object") return null;

    try {
      const data = await updateWorkspaceAPI(workspace.workspaceId, {
        preferences: patch,
      });
      setWorkspace(data);
      return data;
    } catch (error) {
      window.alert(error?.message || "Failed to update preferences");
      return null;
    }
  };

  const value = {
    workspace,
    workspaceIdInput,
    setWorkspaceIdInput,
    openWorkspace,
    closeWorkspace,
    deleteWorkspace,
    renameWorkspace,
    updatePreferences,
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
