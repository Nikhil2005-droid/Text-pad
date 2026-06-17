# Product Requirements Document

## Product Name

Text Pad

## Product Summary

Text Pad is a workspace-based writing and code companion. It lets users open a named workspace, create notes and code snippets, customize note typography, write in supported Indian scripts, and protect sensitive workspaces with a password. The product is designed as a single-page web app with a premium notebook feel and a combined notes/code workflow.

## Target Users

- Students who keep notes and code snippets in the same project space.
- Developers who need a lightweight scratchpad for snippets, experiments, and references.
- Multilingual writers who want Telugu, Hindi, Tamil, or Malayalam script support.
- Individual users who want a simple workspace ID instead of account-heavy onboarding.

## Core Value Proposition

Users can return to a named workspace and immediately continue working across notes and code without rebuilding context. The app remembers recent workspaces, preferences, pinned items, note appearance, and editing state.

## Primary Features

### Workspace Access

- Users enter a workspace ID to open or create a workspace.
- Workspace IDs must be at least 3 characters.
- Existing protected workspaces require a password.
- Recently opened workspaces appear on the entry screen.
- Protected workspace IDs can be remembered locally so users are prompted for a password when returning.

### Workspace Identity

- Users can rename the workspace display name.
- Users can update the workspace ID.
- Workspace ID changes must avoid collisions.
- Workspace identity changes must preserve access tokens when applicable.

### Workspace Protection

- Users can add a password to a workspace.
- Users can remove a password after confirming the current password.
- Passwords are hashed and salted server-side.
- Password hashes and salts are never returned to the client.
- Protected workspace access uses temporary workspace tokens.

### Notes

- Users can create, select, rename, edit, save, finish, pin, delete, bulk delete, and restore notes.
- Notes support rich text content via HTML and plain text extraction.
- Notes support title and body editing.
- Unsaved changes are tracked.
- Save status can be idle, saving, saved, or error.
- Notes support revision-based conflict detection.
- If another tab changes a note, the app warns the user and can restore the local draft.
- Notes can be written on ruled or plain paper.

### Note Studio

- Users can open Note Studio from the note header.
- Desktop uses a right-side panel.
- Mobile uses a rounded floating panel that stays hidden until opened.
- Note Studio controls paper appearance, typography, text size, ruled lines, rich text formatting, and script layout.

### Note Appearance

- Supported note languages: English, Telugu, Hindi, Tamil, Malayalam.
- Supported note font styles: literary, editorial, modern.
- Supported note text sizes: compact, comfortable, large, grand.
- Supported note colors include preset tones and custom valid hex values.
- Ruled line mode can be enabled or disabled per note.
- Mobile writing text is reduced so it fits better between ruled lines.

### Script Layout and Transliteration

- Non-English note languages expose a script layout.
- Script layout appears below the note title field.
- Script layout supports horizontal scrolling for sections and rows.
- Script buttons insert characters at the active caret.
- Telugu, Hindi, Tamil, and Malayalam script keyboard data is local.
- Physical keyboard transliteration is supported where configured.
- Optional Google transliteration can be enabled on the backend.

### Rich Text Editing

- Users can apply bold and italic formatting.
- Users can apply block styles such as paragraph and headings.
- Editor preserves caret selection for toolbar and script insertion.
- Editor scrolls to keep the caret visible after script insertion.

### Code Studio

- Users can create, select, rename, edit, save, finish, pin, delete, bulk delete, and restore code entries.
- Code entries support a title and code body.
- Code entries display line numbers.
- Code font style can be changed from preferences.
- Code entries also use revision-based conflict handling.

### Sidebar Library

- Sidebar lists notes and code entries.
- Users can switch between Notes and Code tabs.
- Users can search visible items by title and body.
- Users can sort by recently updated, newest first, or title A-Z.
- Pinned items appear at the top.
- Multiple items can be selected and deleted.
- Desktop sidebar can be resized and collapsed.
- Mobile sidebar opens as a drawer and supports swipe gesture access.

### Settings

- Workspace settings are available from the navbar.
- Users can configure:
  - auto-replace
  - ruled notes
  - delete confirmations
  - autosave toasts
  - default note language
  - default note font style
  - default note color
  - code font style
  - workspace name and workspace ID
  - workspace password protection

### In-Product Docs

- Docs page explains workspace, note, code, settings, mobile, keyboard, and deployment concepts.

### Feedback and Confirmation

- Toast messages communicate save, create, rename, delete, restore, and error states.
- Confirm dialogs protect destructive actions when enabled.
- Undo restore is available for deleted notes and code entries.

### Dark Mode

- Users can toggle dark mode from the navbar.
- Dark mode is stored in local storage.
- Dark mode adjusts backgrounds, panels, editor surfaces, text colors, and footer link styling.

### Footer

- Footer displays the current year and product name.
- "Nikhil" is a highlighted clickable portfolio link.
- Hover/focus on the name suggests viewing the portfolio.

## Non-Functional Requirements

- The app must run as a React/Vite frontend and Express/MongoDB backend.
- The production server must serve both API routes and `client/dist`.
- Node version must be 20 or newer.
- Client build must pass before deployment.
- Client lint must pass before deployment.
- Utility tests must pass before deployment.
- Backend must avoid returning sensitive security fields.
- API requests must be rate limited.
- JSON request size must be limited.
- CORS must be configurable.
- The app must respect reduced-motion preferences.

## Success Metrics

- User can create or reopen a workspace in under 10 seconds.
- User can create and save a note without reading documentation.
- User can switch between notes and code without data loss.
- Protected workspace does not expose password hashes or salts.
- Mobile user can open Note Studio and script layout without hidden panels or unreadable text.
- Build, lint, and tests pass in CI or deployment.

## Out Of Scope For Current Version

- Multi-user real-time collaboration.
- Full account system with email login.
- Role-based access control.
- Cloud file uploads.
- End-to-end encryption.
- Full syntax highlighting for code.
- Offline-first synchronization.
