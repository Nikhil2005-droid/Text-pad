# Project Structure

This document separates the active runtime files from supporting or legacy files so the repository is easier to understand during handoff, review, and deployment.

## 1. Active Frontend Files

### App entry and routing

- `client/index.html`: HTML entry point for the Vite app.
- `client/src/main.jsx`: frontend bootstrap.
- `client/src/App.jsx`: route registration.
- `client/src/api.js`: browser API client for workspace, note, and code endpoints.

### UI shell and design system

- `client/src/index.css`: shared design tokens, buttons, inputs, panels, and utilities.
- `client/src/components/AppLayout.jsx`: app shell wrapper.
- `client/src/components/GrainientBackground.jsx`: background composition.
- `client/src/components/GrainWave.jsx`: animated grain-wave background effect for in-app surfaces.
- `client/src/components/Prism.jsx`: animated prism shader background effect.
- `client/src/components/Navbar.jsx`: top navigation and workspace controls.
- `client/src/components/Footer.jsx`: global footer.

### Editor and workspace UI

- `client/src/components/WorkspaceGate.jsx`: workspace entry screen.
- `client/src/components/Sidebar.jsx`: note/code list, filters, and item actions.
- `client/src/components/NoteEditor.jsx`: note editor surface.
- `client/src/pages/WorkspacePage.jsx`: main workspace page and code editor surface.
- `client/src/pages/DocsPage.jsx`: in-product docs page.
- `client/src/pages/SettingsPage.jsx`: workspace settings page.

### Client state and functionality

- `client/src/context/WorkspaceContext.jsx`: workspace session, open/close flow, and persistence.
- `client/src/hooks/useWorkspace.js`: workspace context hook.
- `client/src/hooks/useNotes.js`: note/code CRUD state, autosave, pinning, and editor sync.
- `client/src/utils/autoReplace.js`: typing replacements and editor helpers.

## 2. Active Backend Files

- `server/server.js`: Express app, API mount, static client hosting, and server startup.
- `server/db.js`: MongoDB connection.
- `server/models/Workspace.js`: workspace schema, embedded notes, codes, preferences, and security.
- `server/routes/workspaceRoutes.js`: workspace, note, and code API routes.
- `server/utils/workspaceSecurity.js`: password hashing, access tokens, and response sanitizing.

## 3. Deployment-Critical Files

- `package.json`: root deployment scripts and backend runtime dependencies.
- `client/package.json`: frontend build and lint scripts.
- `client/vite.config.js`: dev proxy and frontend build config.
- `server/.env.example`: backend runtime env template.
- `client/.env.example`: frontend env template.
- `.gitignore`: excludes generated and local-only files.

## 4. Legacy or Review-Only Files

These files are not part of the active runtime path and should be treated as review/reference material unless you deliberately bring them back:

- `client/src/App.backup.jsx`
- `client/src/App.css`
- `client/src/main.js`
- `client/public/vite.svg`
- `client/src/assets/react.svg`
- `server/notes.json`
- `code-pad/` if it remains unused in your workflow

## 5. Ownership By Concern

### UI design

- `client/src/index.css`
- `client/src/components/GrainWave.jsx`
- `client/src/components/Prism.jsx`
- `client/src/components/GrainientBackground.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/components/WorkspaceGate.jsx`
- `client/src/components/Sidebar.jsx`
- `client/src/components/NoteEditor.jsx`
- `client/src/pages/DocsPage.jsx`
- `client/src/pages/SettingsPage.jsx`
- `client/src/pages/WorkspacePage.jsx`

### Client functionality

- `client/src/api.js`
- `client/src/context/WorkspaceContext.jsx`
- `client/src/hooks/useWorkspace.js`
- `client/src/hooks/useNotes.js`
- `client/src/utils/autoReplace.js`

### Backend

- `server/server.js`
- `server/db.js`
- `server/models/Workspace.js`
- `server/routes/workspaceRoutes.js`
- `server/utils/workspaceSecurity.js`
