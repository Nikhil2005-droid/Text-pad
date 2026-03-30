import { useWorkspaceContext } from "../context/WorkspaceContext.jsx";

export function useWorkspace() {
  const {
    workspace,
    workspaceAccessToken,
    workspaceIdInput,
    setWorkspaceIdInput,
    workspacePasswordInput,
    setWorkspacePasswordInput,
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
  } = useWorkspaceContext();

  // Keep old prop names to minimize churn in components.
  return {
    workspace,
    workspaceAccessToken,
    workspaceId: workspaceIdInput,
    setWorkspaceId: setWorkspaceIdInput,
    workspacePassword: workspacePasswordInput,
    setWorkspacePassword: setWorkspacePasswordInput,
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
}
