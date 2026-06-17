# Implementation Plan

## Goal

This document defines the recommended order for building, maintaining, and extending Text Pad. It should be used as the roadmap for future development and refactoring.

## Phase 1: Foundation

### 1. Repository Setup

- Keep root as deployment source of truth.
- Keep `client/` for React/Vite.
- Keep `server/` for Express/MongoDB.
- Keep `docs/` for product and handoff docs.
- Keep legacy files documented but not active.

### 2. App Shell

- Implement React Router routes:
  - `/`
  - `/workspace`
  - `/docs`
  - `/settings`
- Implement `AppLayout`.
- Add navbar, footer, splash screen, and background.
- Add dark mode toggle.

### 3. Backend Foundation

- Create Express app.
- Load `server/.env`.
- Connect MongoDB with Mongoose.
- Add security headers.
- Add JSON body limit.
- Add CORS config.
- Add rate limit middleware.
- Serve `client/dist` when built.

## Phase 2: Workspace System

### 1. Workspace Model

- Add workspace schema.
- Add preferences schema.
- Add security schema.
- Add embedded notes and codes.

### 2. Workspace API

- `POST /api/workspaces/open`
- `GET /api/workspaces/:workspaceId`
- `PATCH /api/workspaces/:workspaceId`
- `DELETE /api/workspaces/:workspaceId`

### 3. Workspace Client State

- Implement `WorkspaceContext`.
- Track workspace, access token, workspace ID input, password input, recent workspaces.
- Store recent workspaces in local storage.
- Store protected workspace prompt state.
- Queue preference updates to prevent race conditions.

### 4. Workspace Gate UI

- Build workspace entry screen.
- Add workspace ID input.
- Add password prompt.
- Add recent workspaces.
- Add open/create behavior.

## Phase 3: Notes

### 1. Note Data

- Add note schema fields:
  - title
  - content
  - contentHtml
  - revision
  - appearance settings

### 2. Note API

- Create note.
- Update note with revision check.
- Delete note.
- Return conflict payload on stale revision.

### 3. Note State

- Implement note draft state.
- Track saved state and dirty state.
- Add save, finish, create, select, rename, delete, restore.
- Add conflict restore flow.
- Add cross-tab sync using BroadcastChannel.

### 4. Note Editor

- Build title input.
- Build rich content editor.
- Normalize note HTML.
- Extract plain text.
- Track word count.
- Draw ruled lines on canvas.
- Add editor resize support.
- Add keyboard shortcuts:
  - save
  - create note
  - finish

## Phase 4: Note Studio

### 1. Appearance Controls

- Add language select.
- Add note font select.
- Add text size select.
- Add paper color palette.
- Add custom color support.
- Add ruled lines toggle.

### 2. Rich Text Controls

- Add bold.
- Add italic.
- Add paragraph and heading styles.
- Preserve selection before applying commands.

### 3. Responsive Note Studio

- Desktop: right panel.
- Mobile: rounded hidden popup opened by button.
- Ensure closed state is fully invisible.

## Phase 5: Script and Multilingual Writing

### 1. Language Registry

- Add language options.
- Add font mappings.
- Add placeholders and locale metadata.

### 2. Script Keyboard Data

- Add local keyboard layouts for:
  - Telugu
  - Hindi
  - Tamil
  - Malayalam

### 3. Script Layout UI

- Place script layout below note title.
- Make keys compact.
- Make layout large enough to browse on mobile.
- Add horizontal scrolling for sections and rows.
- Keep caret visible after insertion.

### 4. Transliteration

- Add local roman transliteration where available.
- Add optional Google transliteration status and API.
- Add backend route for transliteration.
- Add graceful disabled state when Google is not configured.

## Phase 6: Code Studio

### 1. Code Data

- Add code schema fields:
  - title
  - code
  - revision

### 2. Code API

- Create code.
- Update code with revision check.
- Delete code.
- Return conflict payload on stale revision.

### 3. Code UI

- Build Code Studio panel.
- Add title input.
- Add textarea.
- Add line numbers.
- Add code font select.
- Add save and finish.

### 4. Future Code Studio Upgrade

Recommended next work:

- language selection
- syntax highlighting
- copy button
- download button
- search inside code
- optional format action

## Phase 7: Sidebar Library

### 1. Library Modes

- Notes tab.
- Code tab.

### 2. Search and Sort

- Search by title/body.
- Sort by recently updated.
- Sort by newest first.
- Sort by title A-Z.

### 3. Item Actions

- Select.
- Rename.
- Pin.
- Delete.
- Multi-select.
- Bulk delete.
- Restore from toast.

### 4. Responsive Sidebar

- Desktop: resizable/collapsible sidebar.
- Mobile: drawer with backdrop, drag handle, swipe edge opener.

## Phase 8: Settings

### 1. Preferences

- auto-replace
- ruled notes
- confirm deletes
- autosave toasts
- default note language
- default note font
- default note color
- code font style

### 2. Workspace Identity

- edit workspace name
- edit workspace ID

### 3. Password Protection

- add password
- update password
- remove password

## Phase 9: UI Polish and Motion

### 1. Design System

- Define tokens in `index.css`.
- Use panel, panel-muted, panel-inset.
- Use buttons, icon buttons, chips, select components.

### 2. Motion

- Add motion utility classes.
- Add route and panel entrance animations.
- Add moving nav indicators.
- Add script layout reveal.
- Add toast animation.
- Respect reduced motion.

### 3. Footer

- Add current year.
- Add portfolio link for Nikhil.
- Add hover/focus tooltip.

## Phase 10: Testing and Hardening

### 1. Tests

- Add Node test runner.
- Add tests for note utilities.
- Future tests:
  - auto-replace
  - workspace API
  - conflict behavior
  - note editor helpers
  - language transliteration helpers

### 2. Backend Hardening

- Add request size limit.
- Add CORS config.
- Add rate limiter.
- Add security headers.
- Add expiring workspace tokens.

### 3. Deployment Verification

Run before deployment:

```bash
npm run client:test
npm run client:lint
npm run client:build
node --check server/server.js
```

## Phase 11: Deployment

### Recommended Model

Deploy as one Node web service from the root.

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

### Required Env

```env
MONGO_URI=
```

### Optional Env

```env
NODE_ENV=production
CORS_ORIGIN=
JSON_BODY_LIMIT=1mb
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=240
WORKSPACE_TOKEN_TTL_MS=43200000
GOOGLE_TRANSLITERATION_ENABLED=false
```

## Recommended Next Implementation Order

1. Finish Code Studio upgrade.
2. Add API route tests.
3. Split `NoteEditor.jsx` into focused hooks.
4. Add syntax highlighting.
5. Add export/import workspace.
6. Add note history.
7. Add optional account system only if multi-device user identity becomes required.
