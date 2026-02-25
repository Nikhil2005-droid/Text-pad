import { useWorkspaceContext } from "../context/WorkspaceContext.jsx";

export function useWorkspace() {
  const {
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
  } = useWorkspaceContext();

  // Keep old prop names to minimize churn in components.
  return {
    workspace,
    workspaceId: workspaceIdInput,
    setWorkspaceId: setWorkspaceIdInput,
    openWorkspace,
    closeWorkspace,
    deleteWorkspace,
    renameWorkspace,
    updatePreferences,
    setWorkspaceSaveHandler,
    runWorkspaceSaveHandler,
    setWorkspace,
  };
}
